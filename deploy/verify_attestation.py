"""Verify signed GitHub build provenance without GitHub credentials."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from snappy_raw import decode
from trusted_paths import require_trusted

REPO = 'libin0396/shengcai'
REPO_ID = '1443714687'
WORKFLOW = '.github/workflows/ainpe-release.yml'
REF = 'refs/heads/main'
GH = Path('/opt/ainpe/deployer/bin/gh')
CONFIG = Path('/var/lib/ainpe-deployer/attestation-config')
CACHE = Path('/var/lib/ainpe-deployer/attestation-cache')

class RestrictedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        old, new = urlparse(req.full_url), urlparse(newurl)
        if new.scheme != 'https' or new.hostname != old.hostname or new.port not in (None, 443) or new.username or new.password:
            raise ValueError('untrusted attestation redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def _download(url, host, prefix, limit):
    parts = urlparse(url)
    if parts.scheme != 'https' or parts.hostname != host or parts.port not in (None, 443) or parts.username or parts.password or not parts.path.startswith(prefix):
        raise ValueError('untrusted attestation URL')
    req = Request(url, headers={'User-Agent':'ainpe-attestation-verifier', 'Accept':'application/vnd.github+json'})
    with build_opener(RestrictedRedirect()).open(req, timeout=30) as response:
        result = response.read(limit + 1)
    if len(result) > limit: raise ValueError('attestation response too large')
    return result

def _gh_version(gh, env):
    result = subprocess.run([str(gh), '--version'], env=env, stdin=subprocess.DEVNULL,
                            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=10, check=True)
    match = re.match(r'^gh version (\d+)\.(\d+)\.(\d+)(?:\s|$)', result.stdout)
    if not match or tuple(map(int, match.groups())) < (2, 102, 0):
        raise ValueError('GitHub CLI version is too old')

def _secure_path(path, directory):
    require_trusted(path, directory=directory, private=directory)

def verify(artifact, revision, *, repo=REPO, repo_id=REPO_ID, workflow=WORKFLOW,
           ref=REF, gh=GH, config=CONFIG, cache=CACHE):
    if not re.fullmatch(r'[0-9a-f]{40}', revision): raise ValueError('invalid revision')
    digest = hashlib.sha256(Path(artifact).read_bytes()).hexdigest()
    api_path = f'/repos/{repo}/attestations/sha256:{digest}'
    response = json.loads(_download('https://api.github.com' + api_path, 'api.github.com', api_path, 4 * 1024 * 1024))
    records = response.get('attestations')
    if not isinstance(records, list) or not 0 < len(records) <= 30: raise ValueError('missing attestations')
    bundles = []
    total_size = 0
    for record in records[:5]:
        if str(record.get('repository_id')) != repo_id: continue
        bundle = record.get('bundle')
        if bundle is None and isinstance(record.get('bundle_url'), str):
            raw = _download(record['bundle_url'], 'tmaproduction.blob.core.windows.net',
                            f'/attestations/{repo_id}/', 1024 * 1024)
            bundle = json.loads(decode(raw, 2 * 1024 * 1024))
        if isinstance(bundle, dict):
            total_size += len(json.dumps(bundle))
            if total_size > 4 * 1024 * 1024: raise ValueError('attestation bundles too large')
            bundles.append(bundle)
    if not bundles: raise ValueError('missing attestation bundles')
    config, cache = Path(config), Path(cache)
    if not config.is_dir() or not cache.is_dir(): raise ValueError('verification directories unavailable')
    _secure_path(config, True)
    _secure_path(cache, True)
    _secure_path(gh, False)
    env = {'PATH':'/usr/bin:/bin', 'GH_CONFIG_DIR':str(config), 'XDG_CACHE_HOME':str(cache), 'GH_PROMPT_DISABLED':'1'}
    _gh_version(gh, env)
    with tempfile.TemporaryDirectory(prefix='ainpe-attest-') as directory:
        bundle_file = Path(directory) / 'bundle.jsonl'
        bundle_file.write_text(''.join(json.dumps(x, separators=(',', ':')) + '\n' for x in bundles))
        args = [str(gh), 'attestation', 'verify', str(artifact), '--repo', repo, '--bundle', str(bundle_file),
                '--signer-workflow', repo + '/' + workflow, '--source-ref', ref, '--source-digest', revision,
                '--deny-self-hosted-runners', '--format', 'json']
        result = subprocess.run(args, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, timeout=120, check=True)
    if len(result.stdout) > 8 * 1024 * 1024: raise ValueError('verification output too large')
    verified = json.loads(result.stdout)
    expected_uri = f'https://github.com/{repo}/{workflow}@{ref}'
    def matches(item):
        try:
            cert = item['verificationResult']['signature']['certificate']
            return (cert['sourceRepositoryIdentifier'] == repo_id and cert['sourceRepositoryURI'] == f'https://github.com/{repo}'
                    and cert['sourceRepositoryDigest'] == revision and cert['sourceRepositoryRef'] == ref
                    and cert['buildSignerURI'] == expected_uri and cert['buildSignerDigest'] == revision
                    and cert['runnerEnvironment'] == 'github-hosted')
        except (KeyError, TypeError): return False
    if not isinstance(verified, list) or not any(matches(x) for x in verified):
        raise ValueError('verified attestation does not match policy')
