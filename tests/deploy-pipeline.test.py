#!/usr/bin/env python3
"""Exercise packaged builds through the poller with fake network/services."""
import hashlib
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'deploy'))
import build_artifact
import poll_release
from release_switch import prepare
actual_previous_health = poll_release.previous_health
actual_wait_health = poll_release.wait_health

class PipelineTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name).resolve()
        self.releases, self.data, self.archive = (root / name for name in ('releases','data','archive'))
        for directory in (self.releases, self.data, self.archive): directory.mkdir()
        old = self.releases / ('b' * 40)
        old.mkdir()
        self.current = root / 'current'
        self.current.symlink_to(old)
        self.revision = 'a' * 40
        self.artifact = build_artifact.build(self.revision, root / 'artifact').read_bytes()
        self.checksum = (hashlib.sha256(self.artifact).hexdigest() + '  ainpe-runtime.tar.gz\n').encode()
        self.assets = {'ainpe-runtime.sha256':'checksum', 'ainpe-runtime.tar.gz':'artifact'}
        for name, value in [('RELEASES',self.releases),('CURRENT',self.current),('DATA',self.data),('ARCHIVE',self.archive),('JOURNAL',root / 'journal.json')]:
            p = patch.object(poll_release, name, value); p.start(); self.addCleanup(p.stop)
        for name, value in [('main_head',lambda:self.revision), ('release_assets',lambda _:self.assets),
                            ('fetch',lambda url, limit:self.checksum if url == 'checksum' else self.artifact),
                            ('staged_health',lambda *args:True), ('wait_health',lambda *args:True),
                            ('previous_health',lambda *args:True), ('restart',lambda:True),
                            ('verify_provenance',lambda *args:None)]:
            p = patch.object(poll_release, name, value); p.start(); self.addCleanup(p.stop)

    def test_good_release_switches_and_keeps_mutable_data_separate(self):
        self.assertEqual(poll_release.deploy_once(), 'deployed')
        self.assertEqual(self.current.resolve(), self.releases / self.revision)
        self.assertEqual((self.current / 'data').resolve(), self.data)
        self.assertEqual((self.current / '资料库').resolve(), self.archive)
        self.assertEqual(poll_release.deploy_once(), 'unchanged')

    def test_bad_digest_does_not_switch(self):
        self.checksum = ('0' * 64 + '  ainpe-runtime.tar.gz\n').encode()
        with self.assertRaises(ValueError): poll_release.deploy_once()
        self.assertEqual(self.current.resolve().name, 'b' * 40)
        self.assertFalse((self.releases / self.revision).exists())

    def test_health_failure_rolls_back_and_allows_retry(self):
        with patch.object(poll_release, 'wait_health', return_value=False):
            with self.assertRaises(RuntimeError): poll_release.deploy_once()
        self.assertEqual(self.current.resolve().name, 'b' * 40)
        self.assertFalse((self.releases / self.revision).exists())
        self.assertEqual(poll_release.deploy_once(), 'deployed')

    def test_interrupted_release_is_verified_and_resumed(self):
        source = Path(self.temp.name) / 'artifact' / 'ainpe-runtime.tar.gz'
        orphan = prepare(source, hashlib.sha256(self.artifact).hexdigest(), self.revision,
                         self.releases, self.data, self.archive)
        self.assertEqual(poll_release.deploy_once(), 'deployed')
        self.assertEqual(self.current.resolve(), orphan.resolve())

    def test_interrupted_release_with_wrong_contents_is_not_used(self):
        source = Path(self.temp.name) / 'artifact' / 'ainpe-runtime.tar.gz'
        orphan = prepare(source, hashlib.sha256(self.artifact).hexdigest(), self.revision,
                         self.releases, self.data, self.archive)
        (orphan / 'server/production.mjs').write_text('changed')
        with self.assertRaises(ValueError): poll_release.deploy_once()
        self.assertEqual(self.current.resolve().name, 'b' * 40)
        self.assertTrue(orphan.exists())

    def test_untrusted_redirect_hosts_are_rejected(self):
        self.assertTrue(poll_release.allowed('https://github.com/libin0396/shengcai'))
        self.assertFalse(poll_release.allowed('https://github.com.evil.example/file'))
        self.assertFalse(poll_release.allowed('http://github.com/file'))

    def test_root_state_does_not_use_site_writable_directory(self):
        self.assertEqual(poll_release.LOCK.parent, poll_release.STATE)
        self.assertNotEqual(poll_release.STATE, Path('/var/lib/ainpe'))

    def test_main_refuses_writable_state_parent_before_opening_lock(self):
        with tempfile.TemporaryDirectory(dir=Path.home()) as directory:
            parent = Path(directory)
            state = parent / 'state'; state.mkdir(mode=0o700)
            parent.chmod(0o777)
            try:
                with patch.object(poll_release, 'STATE', state), patch.object(poll_release, 'LOCK', state / 'lock'):
                    with self.assertRaises(ValueError): poll_release.main()
                    self.assertFalse((state / 'lock').exists())
            finally:
                parent.chmod(0o700)

    def test_main_refuses_lock_symlink(self):
        with tempfile.TemporaryDirectory(dir=Path.home()) as directory:
            state = Path(directory) / 'state'; state.mkdir(mode=0o700)
            releases = Path(directory) / 'releases'; releases.mkdir(mode=0o755)
            lock = state / 'lock'; lock.symlink_to(Path(directory) / 'target')
            with patch.object(poll_release, 'STATE', state), patch.object(poll_release, 'LOCK', lock), \
                 patch.object(poll_release, 'RELEASES', releases), patch.object(poll_release, 'CURRENT', Path(directory) / 'current'):
                with self.assertRaises(OSError): poll_release.main()
                self.assertFalse((Path(directory) / 'target').exists())

    def test_unverified_build_is_blocked_before_extraction(self):
        with patch.object(poll_release, 'verify_provenance', side_effect=ValueError('invalid attestation')):
            with self.assertRaises(ValueError): poll_release.deploy_once()
        self.assertEqual(self.current.resolve().name, 'b' * 40)
        self.assertFalse((self.releases / self.revision).exists())

    def test_built_artifact_runs_and_reports_identity(self):
        source = Path(self.temp.name) / 'artifact' / 'ainpe-runtime.tar.gz'
        candidate = prepare(source, hashlib.sha256(self.artifact).hexdigest(), self.revision,
                            self.releases, self.data, self.archive)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        env = {**os.environ, 'AINPE_HOST':'127.0.0.1', 'AINPE_PORT':str(port)}
        child = subprocess.Popen(['node', str(candidate / 'server' / 'production.mjs')], env=env,
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            self.assertTrue(poll_release.wait_health(port, self.revision, child))
            self.assertFalse(poll_release.health(port, 'b' * 40))
            with patch.object(poll_release, 'wait_health', actual_wait_health):
                self.assertTrue(actual_previous_health(candidate, port))
                (candidate / 'release.json').unlink()
                self.assertTrue(actual_previous_health(candidate, port))
        finally:
            child.terminate()
            child.wait(timeout=5)

if __name__ == '__main__': unittest.main()
