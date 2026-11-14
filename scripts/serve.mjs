#!/usr/bin/env node
/**
 * Minimal zero-dependency local static server for `./dist`.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const portIdx = process.argv.indexOf('--port');
const PORT = Number(
  (portIdx !== -1 && process.argv[portIdx + 1]) || process.env.PORT || 4173,
);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const full = path.resolve(DIST, rel);
  if (!full.startsWith(DIST) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Not found');
    return;
  }
  const ext = path.extname(full).toLowerCase();
  res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Royal No. 10 Typewriter Studio serving at http://localhost:${PORT}`);
});
