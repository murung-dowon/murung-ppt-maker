/**
 * server.js — PPT Maker 개발 서버
 *
 * - 정적 파일 서빙 (루트: 이 파일이 있는 디렉토리)
 * - GET /api/projects : slides.json이 있는 하위 폴더를 자동 스캔해서 반환
 *   → projects.json이 있으면 name/description 오버라이드로 활용
 *
 * 실행: node server.js
 * URL:  http://localhost:3000/
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// 프로젝트로 인식하지 않을 폴더
const SKIP = new Set(['core', 'figma-plugin', 'node_modules', 'dist', '.git', '.claude']);

function scanProjects() {
  // projects.json — 선택적 메타데이터 오버라이드
  const metaMap = {};
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'projects.json'), 'utf-8'));
    raw.forEach(p => { metaMap[p.id] = p; });
  } catch { /* 없어도 됨 */ }

  const projects = [];

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;

    const slidesPath = path.join(ROOT, entry.name, 'slides.json');
    if (!fs.existsSync(slidesPath)) continue;

    let slides = [];
    try { slides = JSON.parse(fs.readFileSync(slidesPath, 'utf-8')); } catch {}

    const hasPresentation = fs.existsSync(
      path.join(ROOT, entry.name, 'dist', 'presentation.html')
    );

    const meta = metaMap[entry.name] || {};

    projects.push({
      id:              entry.name,
      name:            entry.name,
      description:     meta.description || '',
      hasPresentation,
      slideCount:      slides.length,
    });
  }

  // projects.json에 있는 순서 우선, 나머지는 알파벳순
  const order = Object.keys(metaMap);
  projects.sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return  1;
    return a.id.localeCompare(b.id);
  });

  return projects;
}

const server = http.createServer((req, res) => {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // ── API ──────────────────────────────────────────────
  if (pathname === '/api/projects') {
    const body = JSON.stringify(scanProjects());
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(body);
    return;
  }

  // ── 정적 파일 ─────────────────────────────────────────
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);

  // 디렉토리면 index.html 시도
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch { /* 파일 없음 → 아래에서 404 */ }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${pathname}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } catch (e) {
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`\n🎞  PPT Maker`);
  console.log(`   http://localhost:${PORT}/\n`);
});
