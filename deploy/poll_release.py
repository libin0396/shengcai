#!/usr/bin/env python3
"""Fetch the current main release and deploy with rollback. Run only as root.

The VPS must be provisioned separately, with the current symlink, persistent
directories and ainpe.service already in place. No credentials are required.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import time
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from release_switch import activate, prepare_or_resume, recover_pending
from verify_attestation import verify
from trusted_paths import require_trusted, require_trusted_fd

REPOSITORY = 'libin0396/shengcai'
CURRENT = Path('/opt/ainpe/current')
RELEASES = Path('/opt/ainpe/releases')
DATA = Path('/var/lib/ainpe/data')
ARCHIVE = Path('/var/lib/ainpe/archive')
STATE = Path('/var/lib/ainpe-deployer')
LOCK = STATE / 'deploy.lock'
JOURNAL = STATE / 'deploy-journal.json'
ALLOWED_HOSTS = {'api.github.com', 'github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'}
SHA = re.compile(r'^[0-9a-f]{40}$')

def allowed(url):
    parsed = urlparse(url)
    return parsed.scheme == 'https' and parsed.hostname in ALLOWED_HOSTS and parsed.port in (None, 443) and not parsed.username and not parsed.password

class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not allowed(newurl):
            raise ValueError('untrusted redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

OPENER = build_opener(SafeRedirect())

def fetch(url, limit):
    if not allowed(url):
        raise ValueError('untrusted URL')
    req = Request(url, headers={'User-Agent':'ainpe-release-poller', 'Accept':'application/vnd.github+json'})
    with OPENER.open(req, timeout=30) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('download exceeded size limit')
    return data

def main_head():
    result = subprocess.run(['git', 'ls-remote', '--heads', f'https://github.com/{REPOSITORY}.git', 'refs/heads/main'],
                            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            text=True, timeout=45, check=True, env={**os.environ, 'GIT_TERMINAL_PROMPT':'0'})
    fields = result.stdout.split()
    if len(fields) != 2 or not SHA.fullmatch(fields[0]) or fields[1] != 'refs/heads/main':
        raise ValueError('unexpected main reference')
    return fields[0]

def release_assets(revision):
    tag = 'ainpe-deploy-' + revision
    try:
        release = json.loads(fetch(f'https://api.github.com/repos/{REPOSITORY}/releases/tags/{tag}', 2 * 1024 * 1024))
    except HTTPError as error:
        if error.code == 404:
            return None
        raise
    if release.get('draft') or release.get('tag_name') != tag:
        raise ValueError('unexpected release')
    assets = {item['name']:item['browser_download_url'] for item in release.get('assets', []) if item.get('state') == 'uploaded'}
    names = ('ainpe-runtime.tar.gz', 'ainpe-runtime.sha256')
    if not all(name in assets for name in names):
        return None
    expected = f'https://github.com/{REPOSITORY}/releases/download/{tag}/'
    if any(assets[name] != expected + name for name in names):
        raise ValueError('unexpected artifact location')
    return assets

def health(port, revision):
    from urllib.request import urlopen
    try:
        with urlopen(f'http://127.0.0.1:{port}/api/health', timeout=2) as response:
            info = json.loads(response.read(4097))
        if info != {'status':'ok', 'sourceCommit':revision}:
            return False
        with urlopen(f'http://127.0.0.1:{port}/api/feed/status', timeout=2) as response:
            json.loads(response.read(1024 * 1024))
        return True
    except Exception:
        return False

def wait_health(port, revision, process=None):
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if process is not None and process.poll() is not None:
            return False
        if health(port, revision):
            return True
        time.sleep(.25)
    return False

def previous_health(previous, port=4175):
    """Verify the restored version; support releases predating /api/health."""
    from urllib.request import urlopen
    try:
        manifest = previous / 'release.json'
        if manifest.exists():
            revision = json.loads(manifest.read_text()).get('sourceCommit')
            if not isinstance(revision, str) or not SHA.fullmatch(revision):
                return False
            return wait_health(port, revision)
        expected = hashlib.sha256((previous / 'dist/client/index.html').read_bytes()).digest()
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            try:
                with urlopen(f'http://127.0.0.1:{port}/', timeout=2) as response:
                    content = response.read(5 * 1024 * 1024 + 1)
                with urlopen(f'http://127.0.0.1:{port}/api/feed/status', timeout=2) as response:
                    json.loads(response.read(1024 * 1024))
                if len(content) <= 5 * 1024 * 1024 and hashlib.sha256(content).digest() == expected:
                    return True
            except Exception:
                pass
            time.sleep(.25)
    except Exception:
        return False
    return False

def staged_health(candidate, revision):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = {'PATH':'/usr/local/bin:/usr/bin:/bin', 'AINPE_HOST':'127.0.0.1', 'AINPE_PORT':str(port)}
    proc = subprocess.Popen(['/usr/sbin/runuser', '-u', 'ainpe', '--', '/usr/bin/node', str(candidate / 'server/production.mjs')],
                            env=env, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                            start_new_session=True)
    try:
        return wait_health(port, revision, proc)
    finally:
        import signal
        try:
            os.killpg(proc.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            proc.wait()

def restart():
    return subprocess.run(['/usr/bin/systemctl', 'restart', 'ainpe.service'], stdin=subprocess.DEVNULL,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45).returncode == 0

def verify_provenance(artifact, revision):
    verify(artifact, revision)

def deploy_once():
    recover_pending(JOURNAL, RELEASES, CURRENT, restart, previous_health)
    revision = main_head()
    if CURRENT.is_symlink() and CURRENT.resolve() == (RELEASES / revision).resolve():
        return 'unchanged'
    assets = release_assets(revision)
    if assets is None:
        return 'build-not-ready'
    checksum = fetch(assets['ainpe-runtime.sha256'], 512).decode('ascii')
    match = re.fullmatch(r'([0-9a-f]{64})  ainpe-runtime\.tar\.gz\n', checksum)
    if not match:
        raise ValueError('invalid checksum file')
    blob = fetch(assets['ainpe-runtime.tar.gz'], 20 * 1024 * 1024)
    if main_head() != revision:
        return 'main-changed'
    with tempfile.TemporaryDirectory(prefix='ainpe-download-') as temporary:
        artifact = Path(temporary) / 'release.tar.gz'
        artifact.write_bytes(blob)
        verify_provenance(artifact, revision)
        already_existed = os.path.lexists(RELEASES / revision)
        candidate = prepare_or_resume(artifact, match.group(1), revision, RELEASES, DATA, ARCHIVE)
    def healthy(path, staged):
        return (staged_health(path, revision) and main_head() == revision) if staged else wait_health(4175, revision)
    try:
        activate(CURRENT, candidate, restart, healthy, previous_health, JOURNAL)
    except Exception:
        # Only remove the release created by this invocation after rollback.
        if not already_existed and not os.path.lexists(JOURNAL) and (not CURRENT.is_symlink() or CURRENT.resolve() != candidate.resolve()):
            shutil.rmtree(candidate)
        raise
    return 'deployed'

def main():
    # Guard every ancestor before the root deployer touches state or releases.
    require_trusted(STATE, private=True)
    require_trusted(RELEASES)
    require_trusted(CURRENT.parent)
    require_trusted(Path(__file__).absolute(), directory=False)
    # Prevent overlapping runs and prevent following a malicious lock symlink.
    fd = os.open(LOCK, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        require_trusted_fd(fd, private=True)
    except BaseException:
        os.close(fd)
        raise
    with os.fdopen(fd, 'r+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        print(json.dumps({'status':deploy_once()}))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print response bodies or potentially sensitive environment data.
        print(json.dumps({'status':'failed', 'error':type(error).__name__}))
        raise SystemExit(1)
