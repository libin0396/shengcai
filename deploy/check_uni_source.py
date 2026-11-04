#!/usr/bin/env python3
"""Reject private snapshots and known local artifacts in the exported app."""
from pathlib import Path
import json
import re
from curated_content import EXPECTED,validate

root=Path(__file__).resolve().parent.parent/'uni-app/src'
data=root/'data'
expected={'articles':[],'events':[],'comments':[],'trendingTopics':[],'hotArticleIds':[],'topicGuides':{}}
if json.loads((data/'feed.json').read_text()) != expected:
    raise SystemExit('The embedded feed must remain empty; use the server API.')
for name in EXPECTED:
    validate(name,(data/name).read_text(encoding='utf-8'))
secret=re.compile(r'(?:sk-proj-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
for file in root.rglob('*'):
    if file.is_symlink(): raise SystemExit('Unexpected symlink in uni source')
    if not file.is_file(): continue
    if file.name.startswith('_verify-') or file.suffix.lower() in {'.db','.sqlite','.sqlite3','.pem','.key','.env'}:
        raise SystemExit('Unexpected local artifact in uni source')
    if file.suffix.lower() in {'.vue','.js','.json','.html','.css'} and secret.search(file.read_text(encoding='utf8')):
        raise SystemExit('Possible credential in uni source; inspect locally')
print('Uni source contains only reviewed short curated content and no private feed snapshots or known local artifacts.')
