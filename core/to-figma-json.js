#!/usr/bin/env node
/**
 * core/to-figma-json.js
 *
 * 사용법: node core/to-figma-json.js --project [project-name]
 * 결과물: [project-name]/figma-export.json
 *
 * 각 슬라이드 HTML에서 layout-*, theme-*, 텍스트 요소를 추출해
 * Figma 플러그인이 읽을 수 있는 JSON으로 변환합니다.
 */

const fs   = require('fs');
const path = require('path');

// ─── CLI 인수 파싱 ────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const pIdx    = args.indexOf('--project');
const project = pIdx !== -1 ? args[pIdx + 1] : null;

if (!project) {
  console.error('사용법: node core/to-figma-json.js --project [project-name]');
  process.exit(1);
}

const ROOT      = path.join(__dirname, '..');
const PROJ_DIR  = path.join(ROOT, project);
const SLIDES_JSON = path.join(PROJ_DIR, 'slides.json');

if (!fs.existsSync(PROJ_DIR))    { console.error(`프로젝트 폴더 없음: ${project}`); process.exit(1); }
if (!fs.existsSync(SLIDES_JSON)) { console.error(`slides.json 없음: ${SLIDES_JSON}`); process.exit(1); }

// ─── HTML 파싱 헬퍼 ──────────────────────────────────────────────────────────

/** 슬라이드 element의 class 목록 추출 */
function slideClasses(html) {
  const m = html.match(/<(?:div|section)[^>]*class="([^"]*)"[^>]*>/);
  return m ? m[1].split(/\s+/) : [];
}

/** 특정 class를 가진 첫 element의 텍스트 내용 추출 */
function elText(html, className) {
  // class="... className ..." > ... </tag> 패턴
  const re = new RegExp(
    `class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/`,
    'i'
  );
  const m = html.match(re);
  if (!m) return '';
  // HTML 태그·개행·공백 정리
  return m[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 특정 class를 가진 모든 element의 텍스트 목록 */
function elTexts(html, className) {
  const re = new RegExp(
    `class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/`,
    'gi'
  );
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) results.push(text);
  }
  return results;
}

/** <li> 텍스트 목록 (slide-list 내부) */
function listItems(html) {
  const listM = html.match(/class="[^"]*\bslide-list\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listM) return [];
  const items = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(listM[1])) !== null) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) items.push(text);
  }
  return items;
}

/** .img-placeholder 존재 여부 */
function hasImagePlaceholder(html) {
  return /class="[^"]*\bimg-placeholder\b/.test(html);
}

/** .card 내부 텍스트 블록 목록 */
function cards(html) {
  const re = /class="[^"]*\bcard\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const inner = m[1];
    const title = elText(inner, 'card-title') || elText(inner, 'col-title') || '';
    const body  = elText(inner, 'card-body')  || elText(inner, 'card-desc') || '';
    const stat  = elText(inner, 'card-stat')  || elText(inner, 'stat-number') || '';
    if (title || body || stat) results.push({ title, body, stat });
  }
  return results.slice(0, 6); // 최대 6개
}

/** col-title 목록 (two-col 레이아웃) */
function colTitles(html) {
  return elTexts(html, 'col-title');
}

// ─── 슬라이드 파싱 ───────────────────────────────────────────────────────────

function parseSlide(filePath, index) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const classes = slideClasses(html);

  const layout = classes.find(c => c.startsWith('layout-')) || 'layout-content';
  const theme  = classes.find(c => c.startsWith('theme-'))  || 'default';

  const base = {
    index,
    file:   path.basename(filePath),
    layout,
    theme,
    elements: {},
  };

  // 공통 헤더 요소
  const eyebrow  = elText(html, 'slide-eyebrow') || elText(html, 'slide-label');
  const title    = elText(html, 'slide-title');
  const subtitle = elText(html, 'slide-subtitle') || elText(html, 'slide-sub');
  const meta     = elText(html, 'slide-meta');

  if (eyebrow)  base.elements.eyebrow  = eyebrow;
  if (title)    base.elements.title    = title;
  if (subtitle) base.elements.subtitle = subtitle;
  if (meta)     base.elements.meta     = meta;

  // 레이아웃별 추가 요소
  switch (layout) {
    case 'layout-title': {
      // byline 계열
      const name = elText(html, 'byline-name');
      const role = elText(html, 'byline-role');
      if (name) base.elements.authorName = name;
      if (role) base.elements.authorRole = role;
      break;
    }
    case 'layout-section': {
      const num   = elText(html, 'section-number');
      const label = elText(html, 'section-label') || eyebrow;
      const sec   = elText(html, 'section-title') || title;
      const desc  = elText(html, 'section-desc');
      if (num)   base.elements.sectionNumber = num;
      if (label) base.elements.sectionLabel  = label;
      if (sec)   base.elements.sectionTitle  = sec;
      if (desc)  base.elements.sectionDesc   = desc;
      break;
    }
    case 'layout-content': {
      const items  = listItems(html);
      const cds    = cards(html);
      const callout = elText(html, 'callout');
      if (items.length)  base.elements.listItems = items;
      if (cds.length)    base.elements.cards     = cds;
      if (callout)       base.elements.callout   = callout;
      if (hasImagePlaceholder(html)) base.elements.imagePlaceholder = true;
      break;
    }
    case 'layout-two-col': {
      const cTitles = colTitles(html);
      const items   = listItems(html);
      const cds     = cards(html);
      if (cTitles.length) base.elements.colTitles = cTitles;
      if (items.length)   base.elements.listItems  = items;
      if (cds.length)     base.elements.cards      = cds;
      if (hasImagePlaceholder(html)) base.elements.imagePlaceholder = true;
      break;
    }
    case 'layout-quote': {
      const quote  = elText(html, 'quote-text');
      const author = elText(html, 'quote-author');
      const source = elText(html, 'quote-source');
      if (quote)  base.elements.quoteText   = quote;
      if (author) base.elements.quoteAuthor = author;
      if (source) base.elements.quoteSource = source;
      break;
    }
    case 'layout-closing': {
      const ctitle = elText(html, 'closing-title');
      const csub   = elText(html, 'closing-subtitle');
      const ccon   = elText(html, 'closing-contact');
      if (ctitle) base.elements.closingTitle    = ctitle;
      if (csub)   base.elements.closingSubtitle = csub;
      if (ccon)   base.elements.closingContact  = ccon;
      break;
    }
  }

  return base;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

const slidesJson = JSON.parse(fs.readFileSync(SLIDES_JSON, 'utf-8'));

const output = {
  project: project,
  generatedAt: new Date().toISOString(),
  slides: [],
};

slidesJson.forEach((entry, i) => {
  const filePath = path.join(PROJ_DIR, entry.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP (파일 없음): ${entry.file}`);
    return;
  }
  const slide = parseSlide(filePath, i);
  output.slides.push(slide);
  console.log(`  [${String(i + 1).padStart(2)}] ${slide.layout.padEnd(20)} ${entry.file}`);
});

const outPath = path.join(PROJ_DIR, 'figma-export.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n✅ ${output.slides.length}개 슬라이드 추출 완료`);
console.log(`   → ${path.relative(ROOT, outPath)}`);
console.log(`\n다음 단계: Figma 플러그인 실행 → JSON 붙여넣기 → Generate`);
