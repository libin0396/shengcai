import {createServer} from 'node:http';
import {realpathSync} from 'node:fs';
import {readFile, realpath, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createFeedMiddleware} from './feed-api.mjs';
import {DEFAULT_ROOT} from './feed-store.mjs';

const contentTypes = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.gif':'image/gif', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2',
  '.ttf':'font/ttf', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8',
};

// Keep previously shared public links usable when switching the frontend to
// the uni-app hash router. The host is never derived from a request value.
const legacyRoutes = Object.freeze({
  '/events':'/#/pages/events/index',
  '/workspace':'/#/pages/saved/index',
  '/projects':'/#/pages/simulate/index',
  '/topics/fde':'/#/pages/topic/index?slug=fde',
  '/topics/ai-video':'/#/pages/topic/index?slug=ai-video',
  '/topics/ai-cases':'/#/pages/topic/index?slug=ai-cases',
  '/join/ai-camp':'/#/pages/camp/index',
  '/simulate':'/#/pages/simulate/index',
  '/simulate/fde':'/#/pages/simulate/fde',
  '/simulate/super-ai':'/#/pages/simulate/super',
  '/simulate/ai-video':'/#/pages/simulate/video',
});

function legacyRedirect(rawUrl) {
  let u;
  try { u = new URL(rawUrl, 'http://localhost'); } catch { return null; }
  const pathname = u.pathname.replace(/\/$/, '') || '/';
  if (pathname === '/source') {
    const source = u.searchParams.get('url');
    if (!source) return '/#/pages/camp/index';
    try {
      const parsed = new URL(source);
      if (parsed.protocol === 'https:' && /^(?:www\.)?scys\.com$/i.test(parsed.hostname) && !parsed.username && !parsed.password) {
        return '/#/pages/camp/index?source=' + encodeURIComponent(parsed.href);
      }
    } catch {}
    return '/#/pages/camp/index';
  }
  return legacyRoutes[pathname] || null;
}

// Test real paths as well as lexical paths so assets cannot escape through symlinks.
function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function send(res, status, body, method, headers = {}) {
  const bytes = Buffer.from(body);
  res.writeHead(status, {'Content-Type':'text/plain; charset=utf-8', 'Content-Length':bytes.length, ...headers});
  res.end(method === 'HEAD' ? undefined : bytes);
}

export async function createProductionServer({root = DEFAULT_ROOT, staticRoot = path.join(root, 'dist', 'client'), reservation = null, statsPasswordFile = null} = {}) {
  const assetsRoot = await realpath(staticRoot);
  const feed = createFeedMiddleware({root});
  let reservations=null,tracking=null,board=null,stats=null;
  if(reservation){
    const dbParent=await realpath(path.dirname(reservation.dbPath));
    if(dbParent===assetsRoot || inside(assetsRoot,dbParent))throw new Error('reservation_db_inside_static_root');
    const {createProductionReservationApi}=await import('./production-reservations.mjs');
    reservations=createProductionReservationApi({root,...reservation});
    const {createProductionTrackingApi}=await import('./production-tracking.mjs');
    const trackingPath=path.join(dbParent,'ainpe-tracking.sqlite');
    if(path.resolve(reservation.dbPath)===trackingPath)throw new Error('tracking_db_conflicts_with_reservations');
    tracking=createProductionTrackingApi({root,dbPath:trackingPath,publicOrigin:reservation.publicOrigin});
    const {createProductionStatsApi}=await import('./production-stats.mjs');
    stats=createProductionStatsApi({root,dbPath:trackingPath,publicOrigin:reservation.publicOrigin,passwordFile:statsPasswordFile});
    const {createProductionBoardApi}=await import('./production-board.mjs');
    const boardPath=path.join(dbParent,'ainpe-board.sqlite');
    if(path.resolve(reservation.dbPath)===boardPath)throw new Error('board_db_conflicts_with_reservations');
    board=createProductionBoardApi({root,dbPath:boardPath,publicOrigin:reservation.publicOrigin});
  }
  // Capture the release identity at startup, so a symlink swap cannot make an
  // older process report the new release's identity.
  let sourceCommit = null;
  try {
    const manifest = JSON.parse(await readFile(path.join(root, 'release.json'), 'utf8'));
    if (typeof manifest.sourceCommit === 'string' && /^[0-9a-f]{40}$/.test(manifest.sourceCommit)) sourceCommit = manifest.sourceCommit;
  } catch { /* Local development does not require a release manifest. */ }

  async function staticRequest(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) {
      return send(res, 405, 'Method Not Allowed', req.method, {Allow:'GET, HEAD'});
    }

    let requestPath;
    try { requestPath = decodeURIComponent((req.url || '').split('?')[0]); }
    catch { return send(res, 400, 'Bad Request', req.method); }
    const parts = requestPath.split('/');
    if (!requestPath.startsWith('/') || requestPath.startsWith('//') || requestPath.includes('\\') ||
        requestPath.includes('\0') || parts.some(part => part.startsWith('.'))) {
      return send(res, 400, 'Bad Request', req.method);
    }
    if (requestPath === '/api' || requestPath.startsWith('/api/')) {
      return send(res, 404, 'Not Found', req.method);
    }

    async function loadAsset(name) {
      const candidate = path.resolve(assetsRoot, '.' + name);
      if (!inside(assetsRoot, candidate)) return null;
      try {
        const actual = await realpath(candidate);
        if (!inside(assetsRoot, actual) || !(await stat(actual)).isFile()) return null;
        return {body:await readFile(actual), name:actual};
      } catch (error) {
        if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) return null;
        throw error;
      }
    }

    let asset = await loadAsset(requestPath === '/' ? '/index.html' : requestPath);
    // A browser navigation can use the SPA shell; missing files never become HTML.
    if (!asset && !path.extname(requestPath) && requestPath !== '/assets' &&
        !requestPath.startsWith('/assets/') && (req.headers.accept || '').includes('text/html')) {
      asset = await loadAsset('/index.html');
    }
    if (!asset) return send(res, 404, 'Not Found', req.method);
    res.writeHead(200, {
      'Content-Type':contentTypes[path.extname(asset.name).toLowerCase()] || 'application/octet-stream',
      'Content-Length':asset.body.length,
      'Cache-Control':'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : asset.body);
  }

  const server = createServer((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (['GET', 'HEAD'].includes(req.method)) {
      const redirect = legacyRedirect(req.url || '/');
      if (redirect) { res.writeHead(302, {Location:redirect, 'Cache-Control':'no-store'}); return res.end(); }
    }
    if ((req.url || '').split('?')[0] === '/api/health') {
      if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Method Not Allowed', req.method, {Allow:'GET, HEAD'});
      return send(res, 200, JSON.stringify({status:'ok', sourceCommit}), req.method,
        {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
    }
    const fallback = () => { void staticRequest(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, 'Internal Server Error', req.method);
      else res.destroy();
    }); };
    const afterBoard = () => { void feed(req, res, fallback).catch(() => {
      if (!res.headersSent) send(res, 500, 'Internal Server Error', req.method);
      else res.destroy();
    }); };
    const afterTracking = () => { if(board)board.middleware(req,res,afterBoard);else afterBoard(); };
    const afterStats = () => { if(tracking)tracking.middleware(req,res,afterTracking);else afterTracking(); };
    const afterReservation = () => { if(stats)stats.middleware(req,res,afterStats);else afterStats(); };
    if(reservations){reservations.middleware(req,res,afterReservation);return;}
    void feed(req, res, fallback).catch(() => {
      if (!res.headersSent) send(res, 500, 'Internal Server Error', req.method);
      else res.destroy();
    });
  });
  server.once('close',()=>{reservations?.close();tracking?.close();board?.close();stats?.close();});
  return server;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMainModule()) {
  const host = process.env.AINPE_HOST || '127.0.0.1';
  const port = Number(process.env.AINPE_PORT || '4175');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('AINPE_PORT must be an integer between 1 and 65535.');
    process.exitCode = 1;
  } else {
    try {
      const reservation = process.env.AINPE_RESERVATION_DB && process.env.AINPE_PUBLIC_ORIGIN ? {dbPath:process.env.AINPE_RESERVATION_DB,publicOrigin:process.env.AINPE_PUBLIC_ORIGIN} : null;
      const server = await createProductionServer({reservation,statsPasswordFile:process.env.AINPE_STATS_PASSWORD_FILE||null});
      server.on('error', () => { console.error('Unable to start AINPE server.'); process.exitCode = 1; });
      server.listen(port, host, () => console.log(`AINPE listening on ${host}:${port}`));
    } catch {
      console.error('Unable to start AINPE server; build the project first.');
      process.exitCode = 1;
    }
  }
}
