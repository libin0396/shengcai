#!/usr/bin/env python3
"""Exercise the importer with isolated, minimal release-source fixtures."""
from pathlib import Path
import hashlib
import shutil
import subprocess
import tempfile
import unittest

REPO = Path(__file__).resolve().parent.parent
APPROVED = Path('src/static/learn/media/lesson/rain-lesson-example.pptx')
MEDIA = {
    Path('src/static/learn/media/lesson/rain-lesson-export.pdf'): '98197378c1c73f8334a2e262d635895485780cb18c4eddb6fa707824dc77bcd4',
    Path('src/static/learn/media/picturebook/fox-book.pdf'): 'c8975c6bf6e17ee511c74d2a7cb231033c314977b5c3ba27e2624a30cfa34b78',
    Path('src/static/learn/media/short-drama/finished-story.mp4'): '7b85ae27c34b55b3d6c32ab487fc2a045bbead9c60a6d2f963cecf20beffc99c',
}


class UniImportTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.release = self.root / 'release'
        (self.release / 'deploy').mkdir(parents=True)
        for name in ('import_uni_source.py', 'curated_content.py'):
            shutil.copyfile(REPO / 'deploy' / name, self.release / 'deploy' / name)
        for rel in ('package.json', 'package-lock.json', 'index.html', 'vite.config.js',
                    'src/App.vue', 'src/main.js', 'src/site-mode.js', 'src/manifest.json', 'src/pages.json',
                    'src/data/content.js', 'src/data/storage.js', 'src/data/article-categories.js',
                    'src/data/case-library.mjs', 'src/data/site-config.json',
                    'src/data/article-summaries.json', 'src/data/verified-offline-events.json',
                    'src/data/event-reviews.json', 'src/data/case-studies-published.json'):
            target = self.source / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(REPO / 'uni-app' / rel, target)
        for rel in ('src/pages', 'src/components', 'src/static'):
            (self.source / rel).mkdir(parents=True, exist_ok=True)
        document = self.source / APPROVED
        document.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(REPO / 'uni-app' / APPROVED, document)
        for rel in MEDIA:
            target = self.source / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(REPO / 'uni-app' / rel, target)

    def run_import(self):
        return subprocess.run(['python3', str(self.release / 'deploy/import_uni_source.py'), str(self.source)],
                              capture_output=True, text=True, check=False)

    def test_imports_reviewed_presentation_and_site_mode(self):
        result = self.run_import()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.release / 'uni-app' / APPROVED).read_bytes(), (self.source / APPROVED).read_bytes())
        self.assertEqual((self.release / 'uni-app/src/site-mode.js').read_bytes(),
                         (self.source / 'src/site-mode.js').read_bytes())
        for rel in MEDIA:
            self.assertEqual((self.release / 'uni-app' / rel).read_bytes(), (self.source / rel).read_bytes())

    def test_rejects_changed_document(self):
        (self.source / APPROVED).write_bytes(b'not an approved PowerPoint')
        result = self.run_import()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('lesson example changed', result.stderr)

    def test_rejects_unapproved_document_path(self):
        shutil.copyfile(self.source / APPROVED, self.source / 'src/static/other.pptx')
        result = self.run_import()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('unexpected source file type', result.stderr)

    def test_rejects_tampered_media(self):
        (self.source / next(iter(MEDIA))).write_bytes(b'%PDF-1.7\nnot the reviewed file')
        result = self.run_import()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('media changed', result.stderr)

    def test_rejects_unapproved_media_path(self):
        shutil.copyfile(self.source / next(iter(MEDIA)), self.source / 'src/static/other.pdf')
        result = self.run_import()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('unexpected source file type', result.stderr)

    def test_rejects_wrong_media_format_even_if_digest_matches(self):
        for rel, old_digest in MEDIA.items():
            fake = b'not the expected file format'
            (self.source / rel).write_bytes(fake)
            script = self.release / 'deploy/import_uni_source.py'
            script.write_text(script.read_text().replace(old_digest, hashlib.sha256(fake).hexdigest()))
            result = self.run_import()
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('invalid ' + ('MP4' if rel.suffix == '.mp4' else 'PDF'), result.stderr)
            shutil.rmtree(self.release / 'uni-app')
            shutil.copyfile(REPO / 'uni-app' / rel, self.source / rel)
            shutil.copyfile(REPO / 'deploy/import_uni_source.py', script)


if __name__ == '__main__':
    unittest.main()
