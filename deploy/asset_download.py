"""Bounded anonymous GitHub Release downloads for slow VPS connections."""
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import threading
import time
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

REPOSITORY = 'libin0396/shengcai'
CHUNK = 64 * 1024
MAX_SIZE = 20 * 1024 * 1024
MAX_SECONDS = 240
IO_TIMEOUT = 15

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

OPENER = build_opener(NoRedirect())

def _asset_url(asset_id):
    if not isinstance(asset_id, int) or isinstance(asset_id, bool) or asset_id <= 0:
        raise ValueError('invalid asset ID')
    return f'https://api.github.com/repos/{REPOSITORY}/releases/assets/{asset_id}'

def _allowed_location(url):
    parts = urlparse(url)
    return (parts.scheme == 'https' and parts.hostname in {'release-assets.githubusercontent.com', 'objects.githubusercontent.com'}
            and parts.port in (None, 443) and not parts.username and not parts.password)

def _remaining(deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0: raise TimeoutError('asset download deadline exceeded')
    return min(IO_TIMEOUT, remaining)

def _resolve(asset_id, deadline=None):
    request = Request(_asset_url(asset_id), headers={'User-Agent':'ainpe-release-poller',
        'Accept':'application/octet-stream', 'X-GitHub-Api-Version':'2022-11-28'})
    try:
        response = OPENER.open(request, timeout=_remaining(deadline) if deadline is not None else IO_TIMEOUT)
    except HTTPError as response:
        if response.code not in (302, 303, 307, 308): raise
        location = response.headers.get('Location')
        response.close()
        if not location or not _allowed_location(location): raise ValueError('untrusted asset redirect')
        return location
    else:
        response.close()
        raise ValueError('asset API did not provide a download redirect')

def _range(url, start, end, size, stop, deadline):
    expected = end - start + 1
    for _ in range(3):
        if stop.is_set(): raise RuntimeError('asset range cancelled')
        _remaining(deadline)
        try:
            req = Request(url, headers={'User-Agent':'ainpe-release-poller',
                          'Accept':'application/octet-stream', 'Accept-Encoding':'identity',
                          'Range':f'bytes={start}-{end}'})
            with OPENER.open(req, timeout=_remaining(deadline)) as response:
                if response.status != 206 or response.headers.get('Content-Range') != f'bytes {start}-{end}/{size}':
                    raise ValueError('unexpected range response')
                encoding = response.headers.get('Content-Encoding')
                if encoding and encoding.lower() != 'identity': raise ValueError('unexpected range encoding')
                length = response.headers.get('Content-Length')
                if length != str(expected): raise ValueError('unexpected range length')
                chunks, received = [], 0
                while received < expected:
                    if stop.is_set(): raise RuntimeError('asset range cancelled')
                    _remaining(deadline)
                    block = response.read1(min(8192, expected - received))
                    if not block: break
                    chunks.append(block)
                    received += len(block)
                data = b''.join(chunks)
                if len(data) != expected: raise OSError('incomplete range')
                return data
        except (OSError, HTTPError):
            pass
    # Signed URLs never appear in errors or tracebacks.
    raise RuntimeError('asset range download failed') from None

def _download_ranges(url, size, deadline):
    ranges = iter((start, min(start + CHUNK, size) - 1) for start in range(0, size, CHUNK))
    results, pending = {}, {}
    stop = threading.Event()
    pool = ThreadPoolExecutor(max_workers=4)
    def submit_next():
        try: part = next(ranges)
        except StopIteration: return False
        pending[pool.submit(_range, url, part[0], part[1], size, stop, deadline)] = part
        return True
    try:
        for _ in range(4): submit_next()
        while pending:
            done, _ = wait(pending, timeout=max(0, deadline - time.monotonic()), return_when=FIRST_COMPLETED)
            if not done: raise TimeoutError('asset download deadline exceeded')
            # Inspect all completed tasks for errors before queueing more work.
            for future in done:
                part = pending.pop(future)
                results[part[0]] = future.result()
            for _ in range(len(done)): submit_next()
        return b''.join(results[start] for start in sorted(results))
    except BaseException:
        stop.set()
        for future in pending: future.cancel()
        raise
    finally:
        # On failure, at most four bounded socket reads remain active; no queue
        # of hundreds of downloads can continue running after the first error.
        pool.shutdown(wait=not stop.is_set(), cancel_futures=True)

def download(asset, timeout=MAX_SECONDS):
    if not isinstance(asset, dict): raise ValueError('invalid asset metadata')
    size, digest = asset.get('size'), asset.get('digest')
    if not isinstance(size, int) or isinstance(size, bool) or not 0 < size <= MAX_SIZE:
        raise ValueError('invalid asset size')
    if not isinstance(digest, str) or not re.fullmatch(r'sha256:[0-9a-f]{64}', digest):
        raise ValueError('missing asset digest')
    if not isinstance(timeout, (int, float)) or not 0 < timeout <= MAX_SECONDS:
        raise ValueError('invalid asset download timeout')
    deadline = time.monotonic() + timeout
    url = _resolve(asset.get('id'), deadline)
    data = _download_ranges(url, size, deadline)
    if len(data) != size or hashlib.sha256(data).hexdigest() != digest[7:]:
        raise ValueError('asset digest mismatch')
    return data

def download_bounded(asset, timeout=MAX_SECONDS):
    """Use a killable worker to bound DNS/TLS stalls as well as reads."""
    if not isinstance(timeout, (int, float)) or not 0 < timeout <= MAX_SECONDS:
        raise ValueError('invalid asset download timeout')
    payload = json.dumps({'asset':asset, 'timeout':timeout}).encode()
    if len(payload) > 8192: raise ValueError('asset metadata too large')
    child = subprocess.Popen([sys.executable, str(Path(__file__).absolute()), '--worker'],
        env={'PATH':'/usr/bin:/bin'}, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        output, _ = child.communicate(input=payload, timeout=timeout + 5)
    except BaseException:
        try: os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError: pass
        child.communicate()
        raise RuntimeError('asset download deadline or worker failure') from None
    if child.returncode != 0 or len(output) > MAX_SIZE:
        raise RuntimeError('asset download worker failed')
    return output

if __name__ == '__main__':
    try:
        if sys.argv != [__file__, '--worker']: raise ValueError('invalid invocation')
        payload = sys.stdin.buffer.read(8193)
        if len(payload) > 8192: raise ValueError('asset metadata too large')
        params = json.loads(payload)
        data = download(params['asset'], params['timeout'])
        sys.stdout.buffer.write(data)
    except BaseException:
        # Download responses may include short-lived signed URLs; never log them.
        os._exit(1)
