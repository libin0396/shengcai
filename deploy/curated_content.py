"""Strictly allow only the user-approved, short rewritten public material.

The canonical digest pins the reviewed content, not just its schema. New or
changed material must be reviewed and the expected digest intentionally updated.
"""
import hashlib
import json
import re
from urllib.parse import parse_qs, urlsplit

EXPECTED = {
    'article-summaries.json':'a3479ea99b666c7c7c240d4f8786c7a863efccaf41dcfa8f6d2135c31509d3a1',
    'verified-offline-events.json':'b99ce4e1f11b6fbbf8f5bb42b57069c0bb6cf4f7863a8dfd136406aba73be351',
    'event-reviews.json':'655fee60a423172dde417ce182f4cc64359b366b6fc6b731da0bac87d2845df1',
    'case-studies-published.json':'10281684b5886979d98ed722e96be83b954f9d561be73d86c1ae6c7b44fa5fd6',
}
SUMMARY_IDS={'55521424552448144','45548242582124888','82258454581421112',
             '22258454588222581','14425121225548122','82258452211188182',
             '14425125182185282','14425125428118152','14425125888851412',
             '22258212425811581','22258458144525221','22258458845288281',
             '45548248528525488','55521425512154214','82258452222182222',
             '82258452224185212','82258452244481412','82258452254141182',
             '55521424552484884'}
EVENT_IDS={'10157','8925'}
CASE_IDS={'82258452211188182','45548881815182188','45548854528444458','55521525252258854',
          '14588481121824442','22258215525112441','45548855154225128','22258221581184141',
          '14422114455242422','82255821128414422','55521425885428284','14425125822512542',
          '22258212425811581','45544522454884258','55521521254555184'}
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
    if name not in EXPECTED or len(raw)>(40000 if name=='case-studies-published.json' else 10000): raise ValueError('unapproved curated data')
    value=json.loads(raw,object_pairs_hook=unique_pairs)
    canonical=json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    if hashlib.sha256(canonical).hexdigest()!=EXPECTED[name]: raise ValueError('curated content changed; review required')
    if name=='article-summaries.json':
        if not isinstance(value,dict) or set(value)!=SUMMARY_IDS: raise ValueError('invalid curated article IDs')
        for key,fields in value.items():
            if not key.isdigit() or not isinstance(fields,dict) or set(fields)!={'what','how','note'} or not all(short(v,160) for v in fields.values()):
                raise ValueError('invalid short article summary')
    elif name=='case-studies-published.json':
        fields={'id','title','author','direction','category','startTags','topics','publishedAt','sourceUrl','sourceTitle','oneLiner','project','start','steps','numbers','pitfalls','judgement','simulation','related','campHook'}
        if not isinstance(value,list) or len(value)!=len(CASE_IDS) or {x.get('id') for x in value if isinstance(x,dict)}!=CASE_IDS: raise ValueError('invalid case IDs')
        for item in value:
            if not isinstance(item,dict) or set(item)!=fields: raise ValueError('invalid case fields')
            if not all(short(item[k],260) for k in ('title','author','direction','category','sourceTitle','oneLiner','campHook')): raise ValueError('invalid case text')
            if item['category'] not in {'miniapp','development','video','overseas','fde','content','agent'} or not isinstance(item['publishedAt'],int) or isinstance(item['publishedAt'],bool): raise ValueError('invalid case category or date')
            for k in ('startTags','topics'):
                if not isinstance(item[k],list) or len(item[k])>8 or not all(short(x,40) for x in item[k]): raise ValueError('invalid case tags')
            if item['sourceUrl']!='https://scys.com/articleDetail/xq_topic/'+item['id']: raise ValueError('invalid case source')
            for key,keys in [('project',{'what','audience','acquisition','revenueModel'}),('start',{'occupation','experience','dailyTime','budget'})]:
                if not isinstance(item[key],dict) or set(item[key])!=keys or not all(v is None or short(v,260) for v in item[key].values()): raise ValueError('invalid case details')
            for key,keys in [('steps',{'title','detail'}),('numbers',{'label','value','note'}),('pitfalls',{'title','detail'})]:
                if not isinstance(item[key],list) or not 1<=len(item[key])<=6: raise ValueError('invalid case sections')
                for row in item[key]:
                    if not isinstance(row,dict) or set(row)!=keys or not all(v is None or short(v,260) for v in row.values()): raise ValueError('invalid case row')
            if not isinstance(item['judgement'],dict) or set(item['judgement'])!={'fitFor','thinkFirst'}: raise ValueError('invalid case judgement')
            for rows in item['judgement'].values():
                if not isinstance(rows,list) or not 1<=len(rows)<=6 or not all(short(v,260) for v in rows): raise ValueError('invalid case judgement text')
            sim=item['simulation']
            if sim is not None and (not isinstance(sim,dict) or not short(sim.get('name'),80) or not ((set(sim)=={'name','file'} and sim['file'] in {'miniapp','video','education-ppt','books','brain','trends'}) or (set(sim)=={'name','url'} and sim['url']=='/pages/simulate/fde'))): raise ValueError('invalid case simulation')
            if not isinstance(item['related'],list) or len(item['related'])>3 or not all(x in CASE_IDS and x!=item['id'] for x in item['related']): raise ValueError('invalid related cases')
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
