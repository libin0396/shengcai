import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import {copyFile, mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {createServer as createNetServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProductionServer} from '../server/production.mjs';

let dir, server, base, port;
before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'ainpe-production-'));
  const client = path.join(dir, 'dist', 'client');
  await mkdir(path.join(client, 'assets'), {recursive:true});
  await mkdir(path.join(dir, 'data'), {recursive:true});
  await mkdir(path.join(dir, 'server'), {recursive:true});
  await mkdir(path.join(dir, 'src'), {recursive:true});
  const project = fileURLToPath(new URL('../', import.meta.url));
  for (const file of ['server/production.mjs', 'server/feed-api.mjs', 'server/feed-store.mjs', 'src/sync-schedule.js']) {
    await copyFile(path.join(project, file), path.join(dir, file));
  }
  await writeFile(path.join(dir, 'package.json'), '{"type":"module"}');
  await writeFile(path.join(dir, 'release.json'), JSON.stringify({sourceCommit:'a'.repeat(40)}));
  await symlink(dir, path.join(dir, 'current'), 'dir');
  await writeFile(path.join(client, 'index.html'), '<main>AINPE</main>');
  await writeFile(path.join(client, 'assets', 'app.js'), 'export default 1');
  await writeFile(path.join(dir, 'private.txt'), 'private');
  await symlink(path.join(dir, 'private.txt'), path.join(client, 'assets', 'outside.txt'));
  await writeFile(path.join(dir, 'data', 'live-feed.json'), JSON.stringify({
    version:1, updatedAt:'2026-11-03T04:30:00Z', fetchedAt:'2026-11-03T04:30:00Z',
    articles:[{id:'1', entityType:'xq_topic', title:'AI 案例', publishedAt:1790000000, sourceUrl:'https://scys.com/articleDetail/xq_topic/1'}],
    events:[], hotArticleIds:[], trendingTopics:[], featuredEventId:null, comments:[], topicGuides:{},
    sync:{status:'ok', lastAttemptAt:'2026-11-03T04:30:00Z', lastSuccessAt:'2026-11-03T04:30:00Z', message:''},
  }));
  server = await createProductionServer({root:dir});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
  base = `http://127.0.0.1:${port}`;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (dir) await rm(dir, {recursive:true, force:true});
});

test('serves the SPA and assets with correct types, without hiding missing files', async () => {
  let response = await fetch(base + '/events', {headers:{Accept:'text/html'}});
  assert.equal(response.status, 200);
  assert.match(await response.text(), /AINPE/);
  response = await fetch(base + '/assets/app.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  response = await fetch(base + '/assets/missing.js', {headers:{Accept:'text/html'}});
  assert.equal(response.status, 404);
  response = await fetch(base + '/api/not-found', {headers:{Accept:'text/html'}});
  assert.equal(response.status, 404);
  response = await fetch(base + '/events', {method:'POST'});
  assert.equal(response.status, 405);
  response = await fetch(base + '/assets/app.js', {method:'HEAD'});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), String(Buffer.byteLength('export default 1')));
  assert.equal(await response.text(), '');
});

test('serves only validated read-only feed endpoints', async () => {
  let health = await fetch(base + '/api/health');
  assert.deepEqual(await health.json(), {status:'ok', sourceCommit:'a'.repeat(40)});
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(base + '/api/health', {method:'POST'})).status, 405);
  let response = await fetch(base + '/api/feed');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.articles[0].title, 'AI 案例');
  assert.equal(data.sync.status, 'ok');
  response = await fetch(base + '/api/feed/status');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).counts.articles, 1);
  response = await fetch(base + '/api/feed', {method:'POST'});
  assert.equal(response.status, 405);
  response = await fetch(base + '/api/feed', {headers:{Origin:'https://other.example'}});
  assert.equal(response.status, 403);
});

test('rejects traversal, hidden paths and symlinks outside the asset directory', async () => {
  const raw = urlPath => new Promise((resolve, reject) => {
    const req = request({host:'127.0.0.1', port, path:urlPath, headers:{Accept:'text/html'}}, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(await raw('/%2e%2e/private.txt'), 400);
  assert.equal(await raw('/%2e%2e%2fprivate.txt'), 400);
  assert.equal(await raw('/.env'), 400);
  assert.equal(await raw('/assets/outside.txt'), 404);
  assert.equal(await raw('/%'), 400);
});

test('CLI starts via both a real release path and a current symlink', async () => {
  for (const entry of [path.join(dir, 'server', 'production.mjs'), path.join(dir, 'current', 'server', 'production.mjs')]) {
    const reservation = createNetServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const selectedPort = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));

    const child = spawn(process.execPath, [entry], {
      env:{...process.env, AINPE_HOST:'127.0.0.1', AINPE_PORT:String(selectedPort)},
      stdio:['ignore', 'pipe', 'pipe'],
    });
    const exited = once(child, 'exit');
    let timer;
    try {
      await Promise.race([
        once(child.stdout, 'data'),
        exited.then(([code]) => { throw new Error(`server exited before listening (code ${code})`); }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('server startup timed out')), 5000); }),
      ]);
      const response = await fetch(`http://127.0.0.1:${selectedPort}/api/feed/status`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).counts.articles, 1);
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
      await exited;
    }
  }
});
