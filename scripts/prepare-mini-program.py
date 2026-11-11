#!/usr/bin/env python3
"""Create a reviewable WeChat build without bundling the website's media library."""
import json
import re
import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / 'uni-app/dist/build/mp-weixin'
if len(sys.argv) != 2:
    raise SystemExit('usage: prepare-mini-program.py NEW_OUTPUT_DIRECTORY')
target = Path(sys.argv[1]).expanduser().resolve()
if target.exists():
    raise SystemExit('output already exists; choose a new directory')
if not (source / 'app.json').is_file():
    raise SystemExit('build the WeChat app first')

# The reviewed mini app loads its public tutorial media over HTTPS. Fail closed
# if a future change introduces a bundled /static/ reference before excluding it.
for item in source.rglob('*'):
    if not item.is_file() or 'static' in item.relative_to(source).parts:
        continue
    if item.suffix not in {'.js', '.json', '.wxml', '.wxss'}:
        continue
    text = item.read_text(encoding='utf-8')
    for match in re.finditer('/static/', text):
        if not text[max(0, match.start()-25):match.start()].endswith('https://ainpe.aisen.xin'):
            raise SystemExit(f'local static reference must be packaged: {item.relative_to(source)}')

shutil.copytree(source, target, ignore=shutil.ignore_patterns('static'))
config = target / 'project.config.json'
data = json.loads(config.read_text(encoding='utf-8'))
data['projectname'] = 'AINPE实战情报站'
config.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'WeChat review build: {target}')
