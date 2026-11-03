import hashlib
import io
import json
from pathlib import Path
import sys
import subprocess
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'deploy'))
import asset_download as assets
import poll_release
actual_resolve = assets._resolve

class Response:
    def __init__(self, body, start, end, total, *, status=206, range_header=None):
        self.body, self.status, self.offset = body, status, 0
        self.headers = {'Content-Range':range_header or f'bytes {start}-{end}/{total}', 'Content-Length':str(len(body))}
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self, length): return self.body[:length]
    def read1(self, length):
        result=self.body[self.offset:self.offset+length]; self.offset+=len(result); return result

class DownloadTest(unittest.TestCase):
    def setUp(self):
        self.contents = bytes(range(256)) * 700
        self.asset = {'id':123,'size':len(self.contents),'digest':'sha256:'+hashlib.sha256(self.contents).hexdigest()}
        self.calls = 0
        def open_range(req, timeout):
            self.calls += 1
            start, end = map(int, req.get_header('Range')[6:].split('-'))
            return Response(self.contents[start:end+1], start, end, len(self.contents))
        a=patch.object(assets, '_resolve', return_value='https://release-assets.githubusercontent.com/file?sig=private')
        b=patch.object(assets.OPENER, 'open', side_effect=open_range)
        a.start(); b.start(); self.addCleanup(a.stop); self.addCleanup(b.stop)

    def test_downloads_bounded_ranges_and_checks_digest(self):
        self.assertEqual(assets.download(self.asset), self.contents)
        self.assertEqual(self.calls, 3)

    def test_rejects_tampered_or_oversized_metadata(self):
        for change in ({'digest':'sha256:'+'0'*64}, {'size':assets.MAX_SIZE+1}, {'id':True}):
            item={**self.asset, **change}
            if change == {'id':True}:
                with self.assertRaises(ValueError): assets._asset_url(True)
            else:
                with self.assertRaises(ValueError): assets.download(item)

    def test_rejects_wrong_content_range(self):
        def wrong(req, timeout):
            return Response(b'\0'*65536, 0, 65535, len(self.contents), range_header='bytes 1-65536/179200')
        with patch.object(assets.OPENER, 'open', side_effect=wrong):
            with self.assertRaises(ValueError): assets.download(self.asset)

    def test_retries_transient_range_failure(self):
        calls = []
        def sometimes(req, timeout):
            calls.append(1)
            if len(calls) == 1: raise OSError('temporary')
            start,end = map(int,req.get_header('Range')[6:].split('-'))
            return Response(self.contents[start:end+1],start,end,len(self.contents))
        with patch.object(assets.OPENER, 'open', side_effect=sometimes):
            self.assertEqual(assets.download(self.asset), self.contents)
        self.assertGreater(len(calls),3)

    def test_range_errors_do_not_include_signed_url(self):
        with patch.object(assets.OPENER, 'open', side_effect=OSError('url?sig=secret')):
            with self.assertRaises(RuntimeError) as error: assets.download(self.asset)
        self.assertNotIn('secret',str(error.exception))
        self.assertIsNone(error.exception.__cause__)

    def test_ref_is_strictly_validated(self):
        sha = 'a' * 40
        response = {'ref':'refs/heads/main','object':{'type':'commit','sha':sha}}
        with patch.object(poll_release, 'fetch', return_value=json.dumps(response).encode()):
            self.assertEqual(poll_release.main_head(),sha)
        response['ref']='refs/heads/not-main'
        with patch.object(poll_release, 'fetch', return_value=json.dumps(response).encode()):
            with self.assertRaises(ValueError):poll_release.main_head()

    def test_allowed_redirect_hosts_only(self):
        self.assertTrue(assets._allowed_location('https://release-assets.githubusercontent.com/file'))
        self.assertFalse(assets._allowed_location('https://release-assets.githubusercontent.com.evil.test/file'))
        self.assertFalse(assets._allowed_location('http://release-assets.githubusercontent.com/file'))
        self.assertFalse(assets._allowed_location('https://user@release-assets.githubusercontent.com/file'))

    def test_resolve_refuses_untrusted_location(self):
        bad = HTTPError('https://api.github.com/asset', 302, 'redirect',
                        {'Location':'https://release-assets.githubusercontent.com.evil.test/file'}, io.BytesIO())
        with patch.object(assets.OPENER, 'open', side_effect=bad):
            with self.assertRaises(ValueError): actual_resolve(123)

    def test_first_failure_does_not_queue_hundreds_of_segments(self):
        started=[]; release=threading.Event()
        def fail_fast(url,start,end,size,stop,deadline):
            started.append(start)
            if start == 0: raise ValueError('bad first range')
            release.wait(1)
            return b'x' * (end-start+1)
        big={'id':123,'size':assets.MAX_SIZE,'digest':'sha256:'+'0'*64}
        start=time.monotonic()
        try:
            with patch.object(assets, '_range', side_effect=fail_fast):
                with self.assertRaises(ValueError): assets.download(big)
            self.assertLess(time.monotonic()-start, .5)
            self.assertLessEqual(len(started), 4)
        finally: release.set()

    def test_absolute_deadline_stops_waiting_for_blocked_workers(self):
        release=threading.Event()
        def blocked(url,start,end,size,stop,deadline):
            release.wait(1)
            return b'x' * (end-start+1)
        start=time.monotonic()
        try:
            with patch.object(assets, '_range', side_effect=blocked):
                with self.assertRaises(TimeoutError): assets.download(self.asset,timeout=.05)
            self.assertLess(time.monotonic()-start, .5)
        finally: release.set()

    def test_worker_is_killed_if_dns_or_tls_exceeds_hard_timeout(self):
        class HungWorker:
            pid=43210
            returncode=None
            def __init__(self): self.calls=[]
            def communicate(self, **kw):
                self.calls.append(kw)
                if len(self.calls)==1: raise subprocess.TimeoutExpired('worker', .05)
                return b'',None
        worker=HungWorker()
        with patch.object(assets.subprocess, 'Popen', return_value=worker) as popen, \
             patch.object(assets.os, 'killpg') as kill:
            with self.assertRaises(RuntimeError) as error: assets.download_bounded(self.asset,timeout=.05)
        kill.assert_called_once_with(worker.pid, assets.signal.SIGKILL)
        self.assertNotIn('sig=', str(popen.call_args))
        self.assertNotIn('sig=', str(error.exception))
        self.assertEqual(worker.calls[0]['timeout'],5.05)

    def test_real_stalled_worker_is_terminated(self):
        with tempfile.TemporaryDirectory() as directory:
            script=Path(directory)/'stalled.py'
            script.write_text('import time\ntime.sleep(60)\n')
            start=time.monotonic()
            with patch.object(assets,'__file__',str(script)):
                with self.assertRaises(RuntimeError): assets.download_bounded(self.asset,timeout=.05)
            self.assertLess(time.monotonic()-start,7)

if __name__ == '__main__': unittest.main()
