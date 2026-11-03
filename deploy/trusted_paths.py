"""Fail closed when privileged deployment paths cross an untrusted directory."""
import os
from pathlib import Path
import stat


def require_trusted(path, *, directory=True, private=False):
    """Check each lexical component without following links.

    Root-owned ancestors are mandatory for the root deployer. In unprivileged
    tests, the current user's directories are also accepted. A trusted parent
    cannot be replaced by an unprivileged process after the check.
    """
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise ValueError('trusted path must be absolute')
    owner = os.geteuid()
    chain = list(reversed((path, *path.parents)))
    for item in chain:
        info = item.lstat()
        final = item == path
        if stat.S_ISLNK(info.st_mode) or info.st_uid not in (0, owner) or info.st_mode & 0o022:
            raise ValueError('untrusted path component')
        if not final or directory:
            if not stat.S_ISDIR(info.st_mode):
                raise ValueError('trusted directory required')
        elif not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
            raise ValueError('trusted regular file required')
    if private and (path.lstat().st_uid != owner or path.lstat().st_mode & 0o077):
        raise ValueError('private owner-only path required')


def require_trusted_fd(fd, *, private=False):
    info = os.fstat(fd)
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or info.st_nlink != 1 or info.st_mode & 0o022:
        raise ValueError('untrusted open file')
    if private and info.st_mode & 0o077:
        raise ValueError('private owner-only file required')
