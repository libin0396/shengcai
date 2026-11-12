import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('uni-app/src/static/learn/ai-play.js', 'utf8');
function appAt(instant) {
  const fixed = new Date(instant).valueOf();
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  }
  const window = { document: {}, location: {search: ''} };
  vm.runInNewContext(source, {window, Date: FixedDate, URLSearchParams});
  return window.AIPlay;
}

test('daily date changes at midnight Beijing time regardless of device timezone', () => {
  assert.equal(appAt('2026-11-11T15:59:59Z').today(), '2026-11-11');
  assert.equal(appAt('2026-11-11T16:00:00Z').today(), '2026-11-12');
  assert.equal(appAt('2026-12-31T16:00:00Z').today(), '2027-01-01');
});

test('calendar arithmetic handles month, leap day and year boundaries', () => {
  const app = appAt('2026-11-11T16:00:00Z');
  assert.equal(app.addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(app.addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(app.addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(app.parseYmd('2026-11-12').getUTCDay(), 4);
});
