#!/usr/bin/env python3
"""Replace the built frontend in the CI workspace, never persistent server data."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
source = root / 'uni-app' / 'dist' / 'build' / 'h5'
target = root / 'dist' / 'client'
if not (source / 'index.html').is_file():
    raise SystemExit('uni H5 build is missing')
if target.is_symlink() or not target.is_dir():
    raise SystemExit('expected a built, non-symlink dist/client directory')
for p in source.rglob('*'):
    if p.is_symlink():
        raise SystemExit('uni H5 build must not contain symlinks')
shutil.rmtree(target)
shutil.copytree(source, target)
