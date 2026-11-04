import json
from pathlib import Path
import sys
import unittest

root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root/'deploy'))
from curated_content import EXPECTED,validate

class CuratedContentTest(unittest.TestCase):
    def test_reviewed_material_passes(self):
        for name in EXPECTED:
            with self.subTest(name=name):
                value=validate(name,(root/'uni-app/src/data'/name).read_text(encoding='utf-8'))
                self.assertEqual(len(value),18 if name=='article-summaries.json' else 2)

    def test_changed_material_must_be_reviewed(self):
        name='article-summaries.json'
        data=json.loads((root/'uni-app/src/data'/name).read_text())
        data[next(iter(data))]['what']+='changed'
        with self.assertRaises(ValueError): validate(name,json.dumps(data,ensure_ascii=False))

    def test_unreviewed_event_or_extra_field_rejected(self):
        for name in ['event-reviews.json','verified-offline-events.json']:
            data=json.loads((root/'uni-app/src/data'/name).read_text())
            data[0]['private']='unexpected'
            with self.subTest(name=name),self.assertRaises(ValueError): validate(name,json.dumps(data,ensure_ascii=False))

    def test_duplicate_fields_and_unknown_files_rejected(self):
        with self.assertRaises(ValueError): validate('article-summaries.json','{"x":1,"x":1}')
        with self.assertRaises(ValueError): validate('feed.json','{}')

if __name__=='__main__': unittest.main()
