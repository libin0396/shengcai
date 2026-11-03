import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'deploy'))
from release_switch import prepare, prepare_or_resume, activate, recover_pending, RollbackFailed

REVISION = 'a' * 40
REQUIRED = ('dist/client/index.html', 'server/production.mjs', 'server/feed-api.mjs',
            'server/feed-store.mjs', 'src/knowledge.json', 'src/discovery.json',
            'src/sync-schedule.js', 'package.json')


def make_archive(path, extra=None, manifest_revision=REVISION):
    entries = {name: b'ok' for name in REQUIRED}
    entries['release.json'] = json.dumps({'sourceCommit': manifest_revision}).encode()
    with tarfile.open(path, 'w:gz') as archive:
        for name, data in entries.items():
            item = tarfile.TarInfo(name); item.size = len(data)
            archive.addfile(item, io.BytesIO(data))
        if extra:
            item = tarfile.TarInfo(extra)
            item.size = 3
            archive.addfile(item, io.BytesIO(b'bad'))
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.releases = self.base / 'releases'; self.releases.mkdir()
        self.data = self.base / 'data'; self.data.mkdir()
        self.materials = self.base / 'archive'; self.materials.mkdir()
        self.artifact = self.base / 'artifact.tar.gz'

    def tearDown(self): self.tmp.cleanup()

    def test_safe_release_preserves_external_data_and_archive(self):
        digest = make_archive(self.artifact)
        target = prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        self.assertEqual((target / 'data').resolve(), self.data.resolve())
        self.assertEqual((target / '资料库').resolve(), self.materials.resolve())
        self.assertEqual((target / 'dist/client/index.html').read_bytes(), b'ok')
        with self.assertRaises(FileExistsError):
            prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)

    def test_rejects_traversal_hash_and_wrong_revision(self):
        digest = make_archive(self.artifact, '../outside')
        with self.assertRaises(ValueError): prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        self.assertFalse((self.base / 'outside').exists())
        self.assertFalse((self.releases / REVISION).exists())
        digest = make_archive(self.artifact, manifest_revision='b' * 40)
        with self.assertRaises(ValueError): prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        with self.assertRaises(ValueError): prepare(self.artifact, '0' * 64, REVISION, self.releases, self.data, self.materials)

    def test_rejects_archive_symlink(self):
        with tarfile.open(self.artifact, 'w:gz') as archive:
            item = tarfile.TarInfo('server/escape'); item.type = tarfile.SYMTYPE; item.linkname = '/etc'
            archive.addfile(item)
        digest = hashlib.sha256(self.artifact.read_bytes()).hexdigest()
        with self.assertRaises(ValueError): prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        self.assertFalse((self.releases / REVISION).exists())

    def test_interrupted_preparation_recovers_exact_release(self):
        digest = make_archive(self.artifact)
        original = prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        recovered = prepare_or_resume(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        self.assertEqual(original, recovered)
        self.assertFalse(any(p.name.startswith('.verify-') for p in self.releases.iterdir()))

    def test_mismatched_interrupted_preparation_is_not_removed(self):
        digest = make_archive(self.artifact)
        orphan = prepare(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        (orphan / 'server/production.mjs').write_bytes(b'changed')
        with self.assertRaises(ValueError):
            prepare_or_resume(self.artifact, digest, REVISION, self.releases, self.data, self.materials)
        self.assertEqual((orphan / 'server/production.mjs').read_bytes(), b'changed')

    def test_switch_and_rollback_on_failed_live_health(self):
        old = self.releases / ('b' * 40); old.mkdir()
        new = self.releases / REVISION; new.mkdir()
        current = self.base / 'current'; current.symlink_to(old)
        calls = []
        def restart(): calls.append('restart'); return True
        def unhealthy(_candidate, *, staged): return staged
        journal = self.base / 'journal.json'
        with self.assertRaises(RuntimeError): activate(current, new, restart, unhealthy, lambda previous: previous == old.resolve(), journal)
        self.assertEqual(current.resolve(), old.resolve())
        self.assertEqual(calls, ['restart', 'restart'])
        activate(current, new, restart, lambda _candidate, *, staged: True, lambda previous: True, journal)
        self.assertEqual(current.resolve(), new.resolve())

    def test_failed_staged_health_never_switches(self):
        old = self.releases / ('b' * 40); old.mkdir()
        new = self.releases / REVISION; new.mkdir()
        current = self.base / 'current'; current.symlink_to(old)
        calls = []
        with self.assertRaises(RuntimeError):
            activate(current, new, lambda: calls.append('restart'), lambda _candidate, *, staged: False, lambda previous: True, self.base / 'journal.json')
        self.assertEqual(current.resolve(), old.resolve())
        self.assertEqual(calls, [])

    def test_rollback_restart_or_health_failure_is_distinct(self):
        old = self.releases / ('b' * 40); old.mkdir()
        new = self.releases / REVISION; new.mkdir()
        current = self.base / 'current'; current.symlink_to(old)
        checks = []
        journal = self.base / 'journal.json'
        with self.assertRaises(RollbackFailed):
            activate(current, new, lambda: True, lambda _candidate, *, staged: staged,
                     lambda previous: checks.append(previous) or False, journal)
        self.assertEqual(current.resolve(), old.resolve())
        self.assertEqual(checks, [old.resolve()])
        self.assertTrue(journal.exists())
        self.assertTrue(recover_pending(journal, self.releases, current, lambda: True, lambda _: True))
        self.assertFalse(journal.exists())

    def test_process_interrupted_after_symlink_swap_recovers_old_release(self):
        old = self.releases / ('b' * 40); old.mkdir()
        new = self.releases / REVISION; new.mkdir()
        current = self.base / 'current'; current.symlink_to(new.resolve())
        journal = self.base / 'journal.json'
        journal.write_text(json.dumps({'previous':str(old.resolve()), 'candidate':str(new.resolve())}))
        calls = []
        self.assertTrue(recover_pending(journal, self.releases, current, lambda: calls.append('restart') or True,
                                        lambda previous: calls.append(previous) or True))
        self.assertEqual(current.resolve(), old.resolve())
        self.assertEqual(calls, ['restart', old.resolve()])
        self.assertFalse(journal.exists())

    def test_failed_recovery_preserves_journal(self):
        old = self.releases / ('b' * 40); old.mkdir()
        new = self.releases / REVISION; new.mkdir()
        current = self.base / 'current'; current.symlink_to(new.resolve())
        journal = self.base / 'journal.json'
        journal.write_text(json.dumps({'previous':str(old.resolve()), 'candidate':str(new.resolve())}))
        with self.assertRaises(RollbackFailed):
            recover_pending(journal, self.releases, current, lambda: True, lambda _: False)
        self.assertEqual(current.resolve(), old.resolve())
        self.assertTrue(journal.exists())


if __name__ == '__main__': unittest.main()
