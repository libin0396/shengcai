#!/usr/bin/env python3
"""Import only reviewed app code/assets; never copy local credentials or feed."""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import zipfile
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
APPROVED_LESSON = Path('src/static/learn/media/lesson/rain-lesson-example.pptx')
APPROVED_LESSON_SHA256 = '52761f528629b313612b23c08743609589e2a87f2eeb3996d9b719bb2f9fb51e'

def validate_lesson(src):
    # The sole allowed binary document is the reviewed three-slide example.
    # Check both its pinned content and its OOXML structure before publication.
    if src.stat().st_size > 9 * 1024 * 1024 or hashlib.sha256(src.read_bytes()).hexdigest() != APPROVED_LESSON_SHA256:
        raise ValueError('lesson example changed; review required')
    try:
        with zipfile.ZipFile(src) as archive:
            names = set(archive.namelist())
            if not {'[Content_Types].xml', 'ppt/presentation.xml', 'ppt/slides/slide1.xml',
                    'ppt/slides/slide2.xml', 'ppt/slides/slide3.xml'}.issubset(names):
                raise ValueError('invalid presentation example')
            if b'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml' not in archive.read('[Content_Types].xml'):
                raise ValueError('invalid presentation content type')
    except zipfile.BadZipFile as exc:
        raise ValueError('invalid presentation example') from exc

def copy_file(rel):
    src=source / rel
    if src.is_symlink() or not src.is_file():
        raise ValueError('missing file or symlink: '+str(rel))
    dst=target / rel
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(src,dst)
for rel in ['package.json','package-lock.json','index.html','vite.config.js',
            'src/App.vue','src/main.js','src/site-mode.js','src/manifest.json','src/pages.json',
            'src/data/content.js','src/data/storage.js','src/data/article-categories.js','src/data/case-library.mjs',
            'src/data/site-config.json']:
    copy_file(Path(rel))
for sub in ['src/pages','src/components','src/static']:
    for src in (source / sub).rglob('*'):
        if src.is_symlink():
            raise ValueError('unexpected symlink: '+str(src))
        if src.is_file():
            if src.name.startswith('_verify-'):
                continue
            rel = src.relative_to(source)
            if rel == APPROVED_LESSON:
                validate_lesson(src)
            elif src.suffix.lower() not in {'.vue','.js','.css','.html','.png','.jpg','.jpeg','.webp','.gif','.svg','.json'}:
                raise ValueError('unexpected source file type: '+str(src))
            copy_file(rel)
data=target/'src/data'
(data/'feed.json').write_text(json.dumps({'articles':[],'events':[],'comments':[],'trendingTopics':[],'hotArticleIds':[],'topicGuides':{}})+'\n')
for name in EXPECTED:
    copy_file(Path('src/data')/name)
print('Imported uni source and reviewed short content; private snapshots and local databases excluded.')
