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
APPROVED_MEDIA = {
    Path('src/static/learn/media/lesson/rain-lesson-export.pdf'): ('98197378c1c73f8334a2e262d635895485780cb18c4eddb6fa707824dc77bcd4', 2 * 1024 * 1024, 'pdf'),
    Path('src/static/learn/media/picturebook/fox-book.pdf'): ('c8975c6bf6e17ee511c74d2a7cb231033c314977b5c3ba27e2624a30cfa34b78', 3 * 1024 * 1024, 'pdf'),
    Path('src/static/learn/media/short-drama/finished-story.mp4'): ('7b85ae27c34b55b3d6c32ab487fc2a045bbead9c60a6d2f963cecf20beffc99c', 5 * 1024 * 1024, 'mp4'),
}

def validate_media(src, spec):
    digest, size_limit, kind = spec
    if src.stat().st_size > size_limit:
        raise ValueError('media exceeds approved size')
    content = src.read_bytes()
    if hashlib.sha256(content).hexdigest() != digest:
        raise ValueError('media changed; review required')
    if kind == 'pdf' and not content.startswith(b'%PDF-'):
        raise ValueError('invalid PDF example')
    if kind == 'mp4' and (len(content) < 12 or content[4:8] != b'ftyp'):
        raise ValueError('invalid MP4 example')

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
            elif rel in APPROVED_MEDIA:
                validate_media(src, APPROVED_MEDIA[rel])
            elif src.suffix.lower() not in {'.vue','.js','.css','.html','.png','.jpg','.jpeg','.webp','.gif','.svg','.json'}:
                raise ValueError('unexpected source file type: '+str(src))
            copy_file(rel)
data=target/'src/data'
(data/'feed.json').write_text(json.dumps({'articles':[],'events':[],'comments':[],'trendingTopics':[],'hotArticleIds':[],'topicGuides':{}})+'\n')
for name in EXPECTED:
    copy_file(Path('src/data')/name)
print('Imported uni source and reviewed short content; private snapshots and local databases excluded.')
