#!/usr/bin/env python3
"""Import only reviewed app code/assets; never copy local credentials or feed."""
from pathlib import Path
import json
import shutil
import sys
from curated_content import EXPECTED,validate

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]).resolve(strict=True)
target = root / 'uni-app'
if target.exists():
    raise SystemExit('uni-app already exists: review and remove it manually before importing')
if not (source / 'package-lock.json').is_file() or not (source / 'src/pages.json').is_file():
    raise SystemExit('source is not the expected uni app')
for name in EXPECTED:
    file=source/'src/data'/name
    if file.is_symlink() or not file.is_file(): raise ValueError('missing curated source or symlink')
    validate(name,file.read_text(encoding='utf-8'))
target.mkdir()
def copy_file(rel):
    src=source / rel
    if src.is_symlink() or not src.is_file():
        raise ValueError('missing file or symlink: '+str(rel))
    dst=target / rel
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(src,dst)
for rel in ['package.json','package-lock.json','index.html','vite.config.js',
            'src/App.vue','src/main.js','src/manifest.json','src/pages.json',
            'src/data/content.js','src/data/storage.js','src/data/article-categories.js',
            'src/data/site-config.json']:
    copy_file(Path(rel))
for sub in ['src/pages','src/components','src/static']:
    for src in (source / sub).rglob('*'):
        if src.is_symlink():
            raise ValueError('unexpected symlink: '+str(src))
        if src.is_file():
            if src.name.startswith('_verify-'):
                continue
            if src.suffix.lower() not in {'.vue','.js','.css','.html','.png','.jpg','.jpeg','.webp','.svg','.json'}:
                raise ValueError('unexpected source file type: '+str(src))
            copy_file(src.relative_to(source))
data=target/'src/data'
(data/'feed.json').write_text(json.dumps({'articles':[],'events':[],'comments':[],'trendingTopics':[],'hotArticleIds':[],'topicGuides':{}})+'\n')
for name in EXPECTED:
    copy_file(Path('src/data')/name)
print('Imported uni source and reviewed short content; private snapshots and local databases excluded.')
