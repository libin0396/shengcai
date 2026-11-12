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
# Some WeChat clients do not apply this page's scoped stylesheet when it is
# loaded only as a page stylesheet. Import that exact generated stylesheet in
# the app stylesheet too; its data-v selectors keep it scoped to this page.
app_style = target / 'app.wxss'
mine_style = target / 'pages/learn/mine.wxss'
if not app_style.is_file() or not mine_style.is_file():
    raise SystemExit('missing app or mine stylesheet; cannot prepare WeChat build')
app_text = app_style.read_text(encoding='utf-8')
mine_text = mine_style.read_text(encoding='utf-8')
if re.search(r'@import\s*[^;]*app\.wxss', mine_text):
    raise SystemExit('mine stylesheet imports app stylesheet; refusing a circular import')
if re.search(r'@import\s*[^;]*pages/learn/mine\.wxss', app_text):
    raise SystemExit('app stylesheet already imports mine stylesheet')
if not all(selector in mine_text for selector in ('.mine.data-v-', '.badges.data-v-', '.bdg-img.data-v-')):
    raise SystemExit('mine stylesheet does not contain expected scoped selectors')
app_style.write_text('@import "./pages/learn/mine.wxss";\n' + app_text, encoding='utf-8')
config = target / 'project.config.json'
data = json.loads(config.read_text(encoding='utf-8'))
data['projectname'] = 'AINPE实战情报站'
config.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'WeChat review build: {target}')
