#!/usr/bin/env python3
"""Exercise the importer with isolated, minimal release-source fixtures."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

REPO = Path(__file__).resolve().parent.parent
APPROVED = Path('src/static/learn/media/lesson/rain-lesson-example.pptx')


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

    def run_import(self):
        return subprocess.run(['python3', str(self.release / 'deploy/import_uni_source.py'), str(self.source)],
                              capture_output=True, text=True, check=False)

    def test_imports_reviewed_presentation_and_site_mode(self):
        result = self.run_import()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.release / 'uni-app' / APPROVED).read_bytes(), (self.source / APPROVED).read_bytes())
        self.assertEqual((self.release / 'uni-app/src/site-mode.js').read_bytes(),
                         (self.source / 'src/site-mode.js').read_bytes())

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


if __name__ == '__main__':
    unittest.main()
