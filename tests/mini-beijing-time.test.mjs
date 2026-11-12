import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('mini program calendar and daily issue selection use Beijing dates on devices in any time zone', () => {
  const source = `
    import * as c from './uni-app/src/data/ai-core.js';
    const issues = [{id:'a',date:'2026-11-11'},{id:'b',date:'2026-11-12'}];
    const before = c.ymd(new Date('2026-11-11T15:59:59.999Z'));
    const after = c.ymd(new Date('2026-11-11T16:00:00.000Z'));
    console.log(JSON.stringify({before,after,issue:c.currentIssue(issues,after).issue.id,
      start:c.weekStart(after), day:c.weekday(after), display:c.mmdd(after),
      year:c.addDays('2026-12-31',1),leap:c.addDays('2028-02-28',1),
      weekDays:c.week(c.blank(),issues,after).map(d=>d.day)}));`;
  for (const tz of ['America/Chicago', 'America/Los_Angeles', 'Asia/Shanghai', 'Pacific/Kiritimati']) {
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', source], {
      cwd: process.cwd(), env: {...process.env, TZ: tz}, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    const actual = JSON.parse(out);
    assert.deepEqual(actual, {before:'2026-11-11',after:'2026-11-12',issue:'b',
      start:'2026-11-09',day:'四',display:'11 月 12 日',year:'2027-01-01',
      leap:'2028-02-29',weekDays:[9,10,11,12,13,14,15]}, tz);
  }
});
