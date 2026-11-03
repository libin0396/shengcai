#!/usr/bin/env python3
"""Package a prebuilt release, excluding credentials and mutable data."""
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import tarfile

ROOT = Path(__file__).resolve().parent.parent
INCLUDE = ('dist/client', 'server', 'src', 'scripts', 'sync/query-plan.json', 'package.json', 'package-lock.json')

def build(commit, output):
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise ValueError('invalid source commit')
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    archive = output / 'ainpe-runtime.tar.gz'
    with tarfile.open(archive, 'w:gz') as tar:
        for name in INCLUDE:
            path = ROOT / name
            if not path.exists():
                raise ValueError(f'missing release input: {name}')
            paths = [path] + (sorted(path.rglob('*')) if path.is_dir() else [])
            for entry in paths:
                if entry.is_symlink() or any(part.startswith('.') for part in entry.relative_to(ROOT).parts):
                    raise ValueError('unexpected hidden file or symlink in release inputs')
                if not (entry.is_file() or entry.is_dir()):
                    raise ValueError('unexpected file type in release inputs')
                tar.add(entry, arcname=str(entry.relative_to(ROOT)), recursive=False)
        manifest = json.dumps({'sourceCommit':commit}, separators=(',', ':')).encode()
        info = tarfile.TarInfo('release.json')
        info.size = len(manifest)
        info.mode = 0o644
        tar.addfile(info, io.BytesIO(manifest))
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / 'ainpe-runtime.sha256').write_text(f'{digest}  ainpe-runtime.tar.gz\n')
    return archive

if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: build_artifact.py SOURCE_COMMIT OUTPUT_DIRECTORY')
    build(sys.argv[1], sys.argv[2])
