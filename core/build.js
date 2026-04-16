/**
 * build.js — PPT Maker 빌드 스크립트
 * 사용법: node core/build.js --project <project-folder>
 *
 * 동작:
 *  1. <project>/slides.json 읽기
 *  2. 각 슬라이드 HTML에서 <div class="slide ..."> 추출
 *  3. core CSS/JS를 인라인으로 삽입
 *  4. <project>/dist/presentation.html 단일 파일 생성
 */

const fs = require('fs');
const path = require('path');

// ── CLI 인자 파싱 ─────────────────────────────────────
const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
if (projectIdx === -1 || !args[projectIdx + 1]) {
  console.error('사용법: node core/build.js --project <project-folder>');
  console.error('예시:   node core/build.js --project people-analytics');
  process.exit(1);
}

const projectName = args[projectIdx + 1];
const ROOT = path.resolve(__dirname, '..');
const PROJECT_DIR = path.join(ROOT, projectName);
const CORE_DIR = path.join(ROOT, 'core');
const DIST_DIR = path.join(PROJECT_DIR, 'dist');

// ── 경로 검증 ─────────────────────────────────────────
if (!fs.existsSync(PROJECT_DIR)) {
  console.error(`❌ 프로젝트 폴더를 찾을 수 없습니다: ${PROJECT_DIR}`);
  process.exit(1);
}

const slidesJsonPath = path.join(PROJECT_DIR, 'slides.json');
if (!fs.existsSync(slidesJsonPath)) {
  console.error(`❌ slides.json을 찾을 수 없습니다: ${slidesJsonPath}`);
  process.exit(1);
}

// ── slides.json 읽기 ──────────────────────────────────
const slides = JSON.parse(fs.readFileSync(slidesJsonPath, 'utf-8'));
console.log(`📋 ${projectName}: ${slides.length}개 슬라이드 발견`);

// ── CSS/JS 읽기 ───────────────────────────────────────
function readCore(filename) {
  const p = path.join(CORE_DIR, filename);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
}

const themeCSS   = readCore('theme.css');
const baseCSS    = readCore('slide-base.css');
const editorCSS  = readCore('editor.css');
const navJS      = readCore('nav.js');
const editorJS   = readCore('editor.js');

// ── 슬라이드 <head> 안의 <style> 블록 추출 ────────────
function extractSlideStyle(html) {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : '';
}

// ── 프로젝트 레벨 CSS 파일 인라인 ────────────────────
function readProjectCSS() {
  try {
    const files = fs.readdirSync(PROJECT_DIR);
    return files
      .filter(f => f.endsWith('.css'))
      .map(f => `/* ${f} */\n` + fs.readFileSync(path.join(PROJECT_DIR, f), 'utf-8'))
      .join('\n');
  } catch (e) { return ''; }
}

const projectCSS = readProjectCSS();

// ── 각 슬라이드 HTML에서 .slide 추출 ─────────────────
function extractSlideDiv(html) {
  // <div class="slide ..."> ... </div> 추출
  // 중첩된 div를 고려해서 괄호 카운팅으로 추출
  const startRe = /<div[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>/i;
  const match = html.match(startRe);
  if (!match) return null;

  const startIdx = html.indexOf(match[0]);
  let depth = 0;
  let i = startIdx;
  let end = -1;

  while (i < html.length) {
    if (html[i] === '<') {
      if (html.slice(i, i + 2) === '</') {
        // 닫는 태그
        const closeMatch = html.slice(i).match(/^<\/(\w+)>/);
        if (closeMatch) {
          if (closeMatch[1].toLowerCase() === 'div') {
            depth--;
            if (depth === 0) {
              end = i + closeMatch[0].length;
              break;
            }
          }
          i += closeMatch[0].length;
          continue;
        }
      } else {
        // 열린 태그
        const openMatch = html.slice(i).match(/^<(\w+)[^>]*>/);
        if (openMatch) {
          if (openMatch[1].toLowerCase() === 'div') depth++;
          i += openMatch[0].length;
          continue;
        }
        // 셀프 클로징 태그 처리
        const selfMatch = html.slice(i).match(/^<[^>]+\/>/);
        if (selfMatch) {
          i += selfMatch[0].length;
          continue;
        }
      }
    }
    i++;
  }

  if (end === -1) return null;
  return html.slice(startIdx, end);
}

// ── 슬라이드 수집 ─────────────────────────────────────
const slideBlocks = [];

slides.forEach((slide, idx) => {
  const filePath = path.join(PROJECT_DIR, slide.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  파일 없음, 건너뜀: ${slide.file}`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const div = extractSlideDiv(html);
  const style = extractSlideStyle(html);

  if (!div) {
    console.warn(`⚠️  .slide div를 찾을 수 없습니다: ${slide.file}`);
    return;
  }

  slideBlocks.push({
    index: idx,
    file: slide.file,
    title: slide.title || `Slide ${idx + 1}`,
    div,
    style,
  });
  console.log(`  ✅ [${idx + 1}/${slides.length}] ${slide.file}`);
});

// ── 발표용 단일 HTML 생성 ─────────────────────────────
const presentationHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Presentation</title>
  <style>
/* ── theme.css ────────────────────────────────── */
${themeCSS}

/* ── slide-base.css ───────────────────────────── */
${baseCSS}

/* ── editor.css ───────────────────────────────── */
${editorCSS}

/* ── project CSS (theme-*.css 등) ──────────────── */
${projectCSS}

/* ── per-slide styles ──────────────────────────── */
${slideBlocks.map((s, i) => s.style ? `/* slide ${i+1}: ${s.file} */\n${s.style}` : '').join('\n')}

/* ── 빌드된 발표용 추가 스타일 ─────────────────── */
body {
  margin: 0;
  overflow: hidden;
}

.slide-wrapper {
  display: none;
  position: fixed;
  inset: 0;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
}

.slide-wrapper.active {
  display: flex;
}

/* 슬라이드 진입 애니메이션 */
.slide-wrapper.active .slide {
  animation: slide-enter 0.25s ease;
}

@keyframes slide-enter {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── 인쇄(PDF) 모드 — 슬라이드 1장 = 1페이지 ─── */
@media print {
  @page {
    size: 1280px 720px;
    margin: 0;
  }

  html, body {
    width: 1280px;
    height: auto;
    overflow: visible;
    background: white;
  }

  /* 발표 모드 래퍼 해제: 모든 슬라이드를 순서대로 출력 */
  .slide-wrapper {
    display: block !important;
    position: relative !important;
    width: 1280px;
    height: 720px;
    page-break-after: always;
    break-after: page;
    background: white;
  }

  .slide {
    transform: none !important;
    width: 1280px !important;
    height: 720px !important;
    box-shadow: none;
  }

  #slide-nav,
  #editor-toggle,
  #editor-toolbar,
  #anim-panel,
  #editor-toast {
    display: none !important;
  }
}
  </style>
</head>
<body class="slide-body">

${slideBlocks.map((s, i) => `
  <!-- Slide ${i + 1}: ${s.title} -->
  <div class="slide-wrapper${i === 0 ? ' active' : ''}" data-slide="${i}" data-file="${s.file}">
    ${s.div}
  </div>`).join('\n')}

<!-- 발표용 네비게이션 스크립트 -->
<script>
(function() {
  const total = ${slideBlocks.length};
  let current = 0;
  const wrappers = document.querySelectorAll('.slide-wrapper');

  // 스케일 조정
  function scaleSlides() {
    const scaleX = (window.innerWidth - 32) / 1280;
    const scaleY = (window.innerHeight - 32) / 720;
    const scale = Math.min(scaleX, scaleY);
    document.querySelectorAll('.slide').forEach(s => {
      s.style.transform = 'scale(' + scale + ')';
      s.style.transformOrigin = 'center center';
    });
  }

  window.addEventListener('resize', scaleSlides);
  scaleSlides();

  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    wrappers[current].classList.remove('active');
    current = idx;
    wrappers[current].classList.add('active');
    updateNav();
    scaleSlides();
  }

  // 네비게이션 UI 생성
  const nav = document.createElement('div');
  nav.id = 'slide-nav';
  nav.innerHTML =
    '<button class="nav-btn" id="nav-prev">&#8592;</button>' +
    '<span class="nav-counter" id="nav-counter">1 / ${slideBlocks.length}</span>' +
    '<button class="nav-btn" id="nav-next">&#8594;</button>';
  document.body.appendChild(nav);

  document.getElementById('nav-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('nav-next').addEventListener('click', () => goTo(current + 1));

  function updateNav() {
    document.getElementById('nav-counter').textContent = (current + 1) + ' / ' + total;
    document.getElementById('nav-prev').disabled = current === 0;
    document.getElementById('nav-next').disabled = current === total - 1;
  }

  updateNav();

  // 키보드
  document.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('editor-active')) return;
    switch(e.key) {
      case 'ArrowLeft': case 'ArrowUp':
        e.preventDefault(); goTo(current - 1); break;
      case 'ArrowRight': case 'ArrowDown': case ' ':
        e.preventDefault(); goTo(current + 1); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End':  e.preventDefault(); goTo(total - 1); break;
    }
  });
})();
</script>

<script>
/* ── editor.js ───────────────────────────────── */
${editorJS}
</script>

</body>
</html>`;

// ── dist 폴더 생성 및 파일 저장 ──────────────────────
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const outPath = path.join(DIST_DIR, 'presentation.html');
fs.writeFileSync(outPath, presentationHTML, 'utf-8');

const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
console.log(`\n✨ 빌드 완료!`);
console.log(`   📁 ${path.relative(ROOT, outPath)}`);
console.log(`   📏 ${sizeKB} KB`);
console.log(`   🎞  ${slideBlocks.length}개 슬라이드`);
