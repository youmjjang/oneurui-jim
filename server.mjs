import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import searchHandler from './api/search.js';
import regionHandler from './api/region.js';
import healthHandler from './api/health.js';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

// Vercel serverless request/response wrapper
function wrapReqRes(req, res, parsedUrl, body) {
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.body = body;

  res.status = function(code) {
    res.statusCode = code;
    return res;
  };

  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. API 라우팅 지원
    if (pathname.startsWith('/api/')) {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        let parsedBody = null;
        if (bodyData) {
          try { parsedBody = JSON.parse(bodyData); } catch { parsedBody = bodyData; }
        }
        wrapReqRes(req, res, parsedUrl, parsedBody);

        try {
          if (pathname === '/api/search') {
            await searchHandler(req, res);
          } else if (pathname === '/api/region') {
            await regionHandler(req, res);
          } else if (pathname === '/api/health') {
            await healthHandler(req, res);
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API not found' }));
          }
        } catch (apiErr) {
          console.error('API Error:', apiErr);
          if (!res.writableEnded) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: apiErr.message }));
          }
        }
      });
      return;
    }

    // 2. 정적 파일 서빙
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    const data = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 4173;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`========================================================`);
  console.log(`  「오늘의 짐」 로컬 서비스 가동 완료`);
  console.log(`  Local URL: http://127.0.0.1:${PORT}`);
  console.log(`========================================================`);
});
