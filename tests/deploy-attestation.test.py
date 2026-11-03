import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'deploy'))
import snappy_raw
import verify_attestation as att

class AttestationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=Path.home()); self.addCleanup(self.tmp.cleanup)
        p = Path(self.tmp.name)
        self.artifact = p / 'artifact'; self.artifact.write_bytes(b'test')
        self.gh = p / 'gh'; self.gh.write_text('test'); self.gh.chmod(0o700)
        self.config = p / 'config'; self.config.mkdir(mode=0o700)
        self.cache = p / 'cache'; self.cache.mkdir(mode=0o700)
        self.sha = 'a' * 40
        self.certificate = {'sourceRepositoryIdentifier':att.REPO_ID, 'sourceRepositoryURI':f'https://github.com/{att.REPO}',
            'sourceRepositoryDigest':self.sha, 'sourceRepositoryRef':att.REF,
            'buildSignerURI':f'https://github.com/{att.REPO}/{att.WORKFLOW}@{att.REF}',
            'buildSignerDigest':self.sha, 'runnerEnvironment':'github-hosted'}
        self.returned_id = att.REPO_ID
        self.version = 'gh version 2.103.3 (2026-01-01)'
        self.commands = []
        def download(*args):
            return json.dumps({'attestations':[{'repository_id':self.returned_id,'bundle':{'x':'fixture'}}]}).encode()
        def command(args, **kwargs):
            self.commands.append((args, kwargs))
            if args[-1] == '--version': return SimpleNamespace(stdout=self.version)
            data = [{'verificationResult':{'signature':{'certificate':self.certificate}}}]
            return SimpleNamespace(stdout=json.dumps(data).encode())
        for name, value in [('_download',download),('subprocess.run',command)]:
            p = patch.object(att, '_download', value) if name == '_download' else patch.object(att.subprocess, 'run', value)
            p.start(); self.addCleanup(p.stop)

    def verify(self):
        return att.verify(self.artifact, self.sha, gh=self.gh, config=self.config, cache=self.cache)

    def test_correct_policy_and_isolated_environment(self):
        self.verify()
        args, kwargs = self.commands[-1]
        self.assertIn('--deny-self-hosted-runners', args)
        self.assertEqual(args[args.index('--source-digest')+1], self.sha)
        self.assertEqual(args[args.index('--source-ref')+1], att.REF)
        self.assertEqual(args[args.index('--signer-workflow')+1], att.REPO+'/'+att.WORKFLOW)
        self.assertNotIn('GH_TOKEN', kwargs['env'])
        self.assertNotIn('GITHUB_TOKEN', kwargs['env'])

    def test_rejects_wrong_certificate_identity(self):
        for key, value in [('sourceRepositoryIdentifier','1'), ('sourceRepositoryDigest','b'*40),
                           ('sourceRepositoryRef','refs/heads/other'), ('buildSignerURI','wrong'),
                           ('buildSignerDigest','b'*40), ('runnerEnvironment','self-hosted')]:
            original=self.certificate[key]; self.certificate[key]=value
            with self.assertRaises(ValueError, msg=key): self.verify()
            self.certificate[key]=original

    def test_rejects_wrong_api_repo_id_and_old_cli(self):
        self.returned_id = '1'
        with self.assertRaises(ValueError): self.verify()
        self.returned_id = att.REPO_ID; self.version = 'gh version 2.101.0 (2026-01-01)'
        with self.assertRaises(ValueError): self.verify()

    def test_rejects_writable_verification_directory(self):
        self.config.chmod(0o777)
        with self.assertRaises(ValueError): self.verify()

    def test_rejects_writable_parent_and_symlink_parent(self):
        parent = Path(self.tmp.name)
        parent.chmod(0o777)
        with self.assertRaises(ValueError): self.verify()
        parent.chmod(0o700)
        target = parent / 'target'; target.mkdir(mode=0o700)
        (target / 'nested').mkdir(mode=0o700)
        link = parent / 'redirected'; link.symlink_to(target, target_is_directory=True)
        with self.assertRaises(ValueError): att._secure_path(link / 'nested', True)

    def test_snappy_literals_copies_and_malformed(self):
        self.assertEqual(snappy_raw.decode(bytes([8,12])+b'abcd'+bytes([1,4])), b'abcdabcd')
        for value in (b'', b'\x08\x0cabc', b'\x04\x01\x00', b'\x81\x80\x80\x80\x80\x01'):
            with self.assertRaises(ValueError): snappy_raw.decode(value)

if __name__ == '__main__': unittest.main()
