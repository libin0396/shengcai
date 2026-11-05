import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTHORIZATION_WAIT_MS, waitForAuthorization} from '../scripts/authorization-wait.mjs';

test('authorization permits twenty minutes for browser confirmation', async () => {
  assert.equal(AUTHORIZATION_WAIT_MS, 20 * 60 * 1000);
  assert.equal(await waitForAuthorization(Promise.resolve(true)), true);
});

test('an unfinished authorization expires and a completed one wins', async () => {
  assert.equal(await waitForAuthorization(new Promise(() => {}), 10), false);
  assert.equal(await waitForAuthorization(Promise.resolve(false), 100), false);
});
