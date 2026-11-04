"""Strictly allow only the user-approved, short rewritten public material.

The canonical digest pins the reviewed content, not just its schema. New or
changed material must be reviewed and the expected digest intentionally updated.
"""
import hashlib
import json
import re
from urllib.parse import parse_qs, urlsplit

EXPECTED = {
    'article-summaries.json':'e894b2d5b83cb2b8634e9f10014e631bfece1dbb1fa8a7c80e113c5cc49894a0',
    'verified-offline-events.json':'b99ce4e1f11b6fbbf8f5bb42b57069c0bb6cf4f7863a8dfd136406aba73be351',
    'event-reviews.json':'655fee60a423172dde417ce182f4cc64359b366b6fc6b731da0bac87d2845df1',
}
SUMMARY_IDS={'55521424552448144','45548242582124888','82258454581421112',
             '22258454588222581','14425121225548122','82258452211188182',
             '14425125182185282','14425125428118152','14425125888851412',
             '22258212425811581','22258458144525221','22258458845288281',
             '45548248528525488','55521425512154214','82258452222182222',
             '82258452224185212','82258452244481412','82258452254141182'}
EVENT_IDS={'10157','8925'}
SECRET=re.compile(r'(?:sk-proj-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)',re.I)

def short(value,limit):
    return isinstance(value,str) and bool(value.strip()) and len(value)<=limit and not SECRET.search(value) and not re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f]',value)

def unique_pairs(pairs):
    result={}
    for key,value in pairs:
        if key in result: raise ValueError('duplicate JSON field')
        result[key]=value
    return result

def validate(name,raw):
    if name not in EXPECTED or len(raw)>10000: raise ValueError('unapproved curated data')
    value=json.loads(raw,object_pairs_hook=unique_pairs)
    canonical=json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    if hashlib.sha256(canonical).hexdigest()!=EXPECTED[name]: raise ValueError('curated content changed; review required')
    if name=='article-summaries.json':
        if not isinstance(value,dict) or set(value)!=SUMMARY_IDS: raise ValueError('invalid curated article IDs')
        for key,fields in value.items():
            if not key.isdigit() or not isinstance(fields,dict) or set(fields)!={'what','how','note'} or not all(short(v,160) for v in fields.values()):
                raise ValueError('invalid short article summary')
    elif name=='verified-offline-events.json':
        fields={'id','name','description','city','district','startTime','lifecycleStatus','typeText','source','url'}
        if not isinstance(value,list) or len(value)!=2 or {x.get('id') for x in value if isinstance(x,dict)}!=EVENT_IDS: raise ValueError('invalid event IDs')
        for item in value:
            if set(item)!=fields or not all(short(item[k],160) for k in fields-{'startTime'}) or not isinstance(item['startTime'],int) or isinstance(item['startTime'],bool) or item['lifecycleStatus']!='ENDED': raise ValueError('invalid event')
            u=urlsplit(item['url'])
            if u.scheme!='https' or u.netloc!='scys.com' or u.path!='/meeting/detail' or parse_qs(u.query)!={'id':[item['id']]} or u.fragment: raise ValueError('invalid event source')
    else:
        fields={'eventId','author','text','sourceId','attribution'}
        if not isinstance(value,list) or len(value)!=2 or {x.get('eventId') for x in value if isinstance(x,dict)}!=EVENT_IDS: raise ValueError('invalid review IDs')
        for item in value:
            if set(item)!=fields or not all(short(item[k],160) for k in fields) or not item['sourceId'].isdigit() or '关联' not in item['attribution']: raise ValueError('invalid review')
    return value
