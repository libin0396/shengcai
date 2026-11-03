#!/usr/bin/env python3
"""Release preparation and atomic switching for a separately provisioned VPS.

This module does not fetch GitHub, install a timer or grant service privileges.
Only use an artifact from the verified main commit after its build has succeeded.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import tarfile
import tempfile

SHA = re.compile(r"^[0-9a-f]{40}$")
ALLOWED = frozenset(("dist", "server", "src", "scripts", "sync", "package.json", "package-lock.json", "release.json"))
MAX_FILE = 20 * 1024 * 1024
MAX_TOTAL = 100 * 1024 * 1024


def file_hash(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as source:
        for part in iter(lambda: source.read(1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()


def _safe_parts(name):
    if not name or name.startswith("/") or "\\" in name:
        raise ValueError("unsafe artifact path")
    # Leading ./ is normal in archives; reject .. anywhere.
    parts = tuple(p for p in PurePosixPath(name).parts if p != ".")
    if not parts or any(p in ("", "..") or p.startswith(".") for p in parts):
        raise ValueError("unsafe artifact path")
    if parts[0] not in ALLOWED:
        raise ValueError("unexpected artifact content")
    return parts


def prepare(archive, sha256, revision, releases, data, materials):
    """Validate and safely extract a locally obtained, hash-checked artifact."""
    if not SHA.fullmatch(revision) or not re.fullmatch(r"[0-9a-f]{64}", sha256):
        raise ValueError("invalid revision or digest")
    if file_hash(archive) != sha256:
        raise ValueError("artifact digest mismatch")
    releases, data, materials = map(Path, (releases, data, materials))
    if not releases.is_dir() or not data.is_dir() or not materials.is_dir():
        raise ValueError("required persistent directories are unavailable")
    destination = releases / revision
    if os.path.lexists(destination):
        raise FileExistsError("release already exists")
    incoming = Path(tempfile.mkdtemp(prefix=".incoming-", dir=releases))
    total, seen = 0, set()
    try:
        with tarfile.open(archive, "r:gz") as tar:
            for member in tar:
                parts = _safe_parts(member.name)
                target = incoming.joinpath(*parts)
                key = str(target.relative_to(incoming))
                if key in seen or not (member.isdir() or member.isfile()):
                    raise ValueError("unsafe or duplicate artifact entry")
                seen.add(key)
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                total += member.size
                if member.size < 0 or member.size > MAX_FILE or total > MAX_TOTAL:
                    raise ValueError("artifact size limit exceeded")
                target.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as source, target.open("xb") as output:
                    shutil.copyfileobj(source, output, 1024 * 1024)
                os.chmod(target, 0o644)
        manifest = json.loads((incoming / "release.json").read_text())
        if not isinstance(manifest, dict) or manifest.get("sourceCommit") != revision:
            raise ValueError("artifact revision mismatch")
        for required in ("dist/client/index.html", "server/production.mjs", "server/feed-api.mjs", "server/feed-store.mjs", "src/knowledge.json", "src/discovery.json", "src/sync-schedule.js", "package.json"):
            if not (incoming / required).is_file():
                raise ValueError("artifact incomplete")
        for directory, _, _ in os.walk(incoming):
            os.chmod(directory, 0o755)
        os.symlink(data.resolve(), incoming / "data")
        os.symlink(materials.resolve(), incoming / "资料库")
        os.rename(incoming, destination)
        return destination
    except BaseException:
        shutil.rmtree(incoming, ignore_errors=True)
        raise


def _tree_signature(root):
    """Describe a release without following links; reject special/hard-linked files."""
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError('release is not a directory')
    signature = {}
    pending = [root]
    while pending:
        directory = pending.pop()
        for entry in directory.iterdir():
            info = entry.lstat()
            name = str(entry.relative_to(root))
            mode = stat.S_IMODE(info.st_mode)
            if stat.S_ISLNK(info.st_mode):
                signature[name] = ('link', os.readlink(entry))
            elif stat.S_ISDIR(info.st_mode):
                signature[name] = ('dir', mode)
                pending.append(entry)
            elif stat.S_ISREG(info.st_mode) and info.st_nlink == 1:
                signature[name] = ('file', mode, file_hash(entry))
            else:
                raise ValueError('unexpected release file type')
    return signature


def prepare_or_resume(archive, sha256, revision, releases, data, materials):
    """Resume interrupted preparation only if the entire release matches.

    Caller holds the deploy lock. Preserve mismatches for manual investigation.
    """
    releases = Path(releases)
    destination = releases / revision
    if not os.path.lexists(destination):
        return prepare(archive, sha256, revision, releases, data, materials)
    with tempfile.TemporaryDirectory(prefix='.verify-', dir=releases) as temp:
        expected = prepare(archive, sha256, revision, temp, data, materials)
        if _tree_signature(destination) != _tree_signature(expected):
            raise ValueError('existing release differs from verified artifact')
    return destination


class RollbackFailed(RuntimeError):
    """The previous service could not be restored and verified healthy."""


def _write_journal(journal, previous, candidate):
    journal = Path(journal)
    fd, name = tempfile.mkstemp(prefix='.deploy-journal-', dir=journal.parent)
    try:
        with os.fdopen(fd, 'w') as handle:
            json.dump({'previous':str(previous), 'candidate':str(candidate)}, handle)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, journal)
    finally:
        if os.path.lexists(name):
            os.unlink(name)


def recover_pending(journal, releases, current, restart, rollback_healthy):
    """Restore the old release after interruption at any point during switch."""
    journal, current, releases = Path(journal), Path(current), Path(releases).resolve()
    if not os.path.lexists(journal):
        return False
    try:
        fd = os.open(journal, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(fd, 'r') as source:
            content = source.read(4097)
        if len(content) > 4096:
            raise ValueError('invalid deployment journal')
        info = json.loads(content)
        if not isinstance(info, dict) or set(info) != {'previous', 'candidate'}:
            raise ValueError('invalid deployment journal')
        previous, candidate = (Path(info[key]) for key in ('previous', 'candidate'))
        for path in (previous, candidate):
            if not path.is_absolute() or path.parent != releases or path.is_symlink() or not path.is_dir():
                raise ValueError('invalid deployment journal')
        if previous == candidate or not current.is_symlink() or current.resolve() not in (previous, candidate):
            raise ValueError('deployment state changed unexpectedly')
        _swap_link(current, previous)
        if not restart() or not rollback_healthy(previous):
            raise RollbackFailed('interrupted release rollback failed')
        journal.unlink()
        return True
    except RollbackFailed:
        raise
    except Exception as error:
        raise RollbackFailed('interrupted release rollback failed') from error


def _swap_link(current, target):
    current, target = Path(current), Path(target)
    if os.path.lexists(current) and not current.is_symlink():
        raise ValueError("current must be a symbolic link")
    fd, name = tempfile.mkstemp(prefix=".current-", dir=current.parent)
    os.close(fd)
    os.unlink(name)
    try:
        os.symlink(str(target), name)
        os.replace(name, current)
    finally:
        if os.path.lexists(name):
            os.unlink(name)


def activate(current, candidate, restart, healthy, rollback_healthy, journal):
    """Switch only after staged health succeeds; roll back on live failure.

    The caller must serialize invocations and provide narrowly scoped service
    restart and health callbacks. No system service is modified by this module.
    """
    current, candidate = Path(current), Path(candidate)
    if not candidate.is_dir() or not healthy(candidate, staged=True):
        raise RuntimeError("candidate health check failed")
    if not current.is_symlink():
        raise ValueError("an existing current release is required for rollback")
    previous = os.readlink(current)
    previous_path = current.resolve(strict=True)
    if os.path.lexists(journal):
        raise ValueError('pending deployment must be recovered first')
    _write_journal(journal, previous_path, candidate.resolve())
    _swap_link(current, candidate.resolve())
    try:
        if not restart() or not healthy(candidate, staged=False):
            raise RuntimeError("live health check failed")
    except BaseException:
        try:
            _swap_link(current, previous)
            if not restart() or not rollback_healthy(previous_path):
                raise RollbackFailed('rollback restart or health check failed')
            Path(journal).unlink()
        except RollbackFailed:
            raise
        except BaseException as error:
            raise RollbackFailed('rollback restart or health check failed') from error
        raise
    Path(journal).unlink()
