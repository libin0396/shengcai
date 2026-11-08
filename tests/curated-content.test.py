import json
import hashlib
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root/'deploy'))
from curated_content import CASE_IDS,EXPECTED,validate

class CuratedContentTest(unittest.TestCase):
    def test_exactly_fifteen_distinct_reviewed_cases(self):
        self.assertEqual(len(CASE_IDS),15)
        self.assertEqual(len(set(CASE_IDS)),15)
        self.assertTrue(all(isinstance(x,str) and x.isdigit() for x in CASE_IDS))

    def test_reviewed_material_passes(self):
        for name in EXPECTED:
            with self.subTest(name=name):
                value=validate(name,(root/'uni-app/src/data'/name).read_text(encoding='utf-8'))
                self.assertEqual(len(value),19 if name=='article-summaries.json' else len(CASE_IDS) if name=='case-studies-published.json' else 2)

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

    def test_case_edits_and_unapproved_sources_are_rejected(self):
        name='case-studies-published.json'
        data=json.loads((root/'uni-app/src/data'/name).read_text())
        data[0]['sourceUrl']='https://example.org/'
        with self.assertRaises(ValueError): validate(name,json.dumps(data,ensure_ascii=False))
        data=json.loads((root/'uni-app/src/data'/name).read_text())
        data[0]['private']='not approved'
        with self.assertRaises(ValueError): validate(name,json.dumps(data,ensure_ascii=False))

    def test_published_case_displays_hide_names_but_retain_source_links(self):
        data=json.loads((root/'uni-app/src/data/case-studies-published.json').read_text())
        for case in data:
            with self.subTest(case=case['id']):
                self.assertTrue(case['author'].startswith('一'), 'use a descriptive anonymous label')
                self.assertEqual(case['sourceTitle'],'生财有术原帖')
                self.assertEqual(case['sourceUrl'],'https://scys.com/articleDetail/xq_topic/'+case['id'])

    def test_simulation_case_names_and_reference_labels_are_generic(self):
        import re
        for name in ('miniapp','video','education-ppt'):
            html=(root/'uni-app/src/static/simulation-games'/f'{name}.html').read_text()
            match=re.search(r'<script type="application/json" id="game-data">(.*?)</script>',html,re.S)
            self.assertIsNotNone(match)
            data=json.loads(match.group(1))
            for case in data['cases']:
                self.assertEqual(case['author'],'一位生财圈友')
            def walk(value):
                if isinstance(value,dict):
                    for key,item in value.items():
                        if key=='ref' and item:
                            self.assertTrue(str(item).startswith('一位圈友'))
                        else:
                            walk(item)
                elif isinstance(value,list):
                    for item in value: walk(item)
            walk(data)

    def test_case_can_have_no_simulation_without_fabricating_a_match(self):
        name='case-studies-published.json'
        data=json.loads((root/'uni-app/src/data'/name).read_text())
        data[0]['simulation']=None
        data[0]['category']='development'
        raw=json.dumps(data,ensure_ascii=False)
        canonical=json.dumps(data,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
        with patch.dict(EXPECTED,{name:hashlib.sha256(canonical).hexdigest()}):
            self.assertIsNone(validate(name,raw)[0]['simulation'])
            self.assertEqual(validate(name,raw)[0]['category'],'development')

    def test_even_reviewed_case_data_rejects_unapproved_simulation_and_source(self):
        name='case-studies-published.json'
        for field,value in [('simulation',{'name':'unknown','url':'https://example.com/'}),('sourceUrl','https://example.com/')]:
            data=json.loads((root/'uni-app/src/data'/name).read_text())
            data[0][field]=value
            canonical=json.dumps(data,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
            with self.subTest(field=field),patch.dict(EXPECTED,{name:hashlib.sha256(canonical).hexdigest()}),self.assertRaises(ValueError):
                validate(name,json.dumps(data,ensure_ascii=False))

if __name__=='__main__': unittest.main()
