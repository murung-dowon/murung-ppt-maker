// ppt-maker → Figma Plugin
// Claude Code가 아래 SLIDE_DATA를 프로젝트 데이터로 업데이트한 뒤
// Figma에서 플러그인 실행 → Generate 버튼 한 번으로 슬라이드 생성

// ─── SLIDE_DATA (Claude Code가 자동 업데이트하는 영역) ──────────────────────
// [SLIDE_DATA_START]
const SLIDE_DATA = null;
// [SLIDE_DATA_END]
// ─────────────────────────────────────────────────────────────────────────────

figma.showUI(__html__, { width: 300, height: 200 });

// 플러그인 열릴 때 UI에 프로젝트 정보 전달
if (SLIDE_DATA) {
  figma.ui.postMessage({
    type: 'ready',
    project: SLIDE_DATA.project,
    count: SLIDE_DATA.slides.length,
  });
} else {
  figma.ui.postMessage({ type: 'no-data' });
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const W = 1280, H = 720, GAP = 120;
const PX = 80,  PY = 64;

// ─── 테마 색상표 ─────────────────────────────────────────────────────────────
const THEMES = {
  'default': {
    bg: '#ffffff', surface: '#f8f9fa',
    text: '#1a1a1a', muted: '#6b7280', light: '#9ca3af',
    accent: '#2563eb', accentBg: '#eff6ff', accentLight: '#dbeafe',
    border: '#e5e7eb',
  },
  'theme-dark': {
    bg: '#0d0c0a', surface: '#1a1917',
    text: '#f0ede8', muted: '#9c9690', light: '#5a5550',
    accent: '#63b3ed', accentBg: '#1a2a3a', accentLight: '#2a4a6a',
    border: '#2a2825',
  },
  'theme-tech': {
    bg: '#0f172a', surface: '#1e293b',
    text: '#f1f5f9', muted: '#94a3b8', light: '#64748b',
    accent: '#06b6d4', accentBg: '#0c2a32', accentLight: '#164e63',
    border: '#1e293b',
  },
  'theme-minimal': {
    bg: '#fafaf9', surface: '#f5f5f4',
    text: '#0a0a0a', muted: '#57534e', light: '#a8a29e',
    accent: '#0a0a0a', accentBg: '#f5f5f4', accentLight: '#e7e5e4',
    border: '#e7e5e4',
  },
  'theme-warm': {
    bg: '#fffbeb', surface: '#fef3c7',
    text: '#1c1917', muted: '#78716c', light: '#a8a29e',
    accent: '#d97706', accentBg: '#fef3c7', accentLight: '#fde68a',
    border: '#fde68a',
  },
};

// ─── 색상 헬퍼 ───────────────────────────────────────────────────────────────
function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

// ─── 폰트 ────────────────────────────────────────────────────────────────────
const F = {
  reg:   { family: 'Inter', style: 'Regular'    },
  med:   { family: 'Inter', style: 'Medium'     },
  semi:  { family: 'Inter', style: 'Semi Bold'  },
  bold:  { family: 'Inter', style: 'Bold'       },
  black: { family: 'Inter', style: 'Extra Bold' },
  gReg:  { family: 'Georgia', style: 'Regular'  },
  gBold: { family: 'Georgia', style: 'Bold'     },
};

async function loadFonts() {
  await Promise.allSettled(Object.values(F).map(f => figma.loadFontAsync(f)));
}

function fonts(theme) {
  const m = theme === 'theme-minimal';
  return { reg: m ? F.gReg : F.reg, semi: m ? F.gBold : F.semi,
           bold: m ? F.gBold : F.bold, black: m ? F.gBold : F.black };
}

// ─── Figma 노드 헬퍼 ─────────────────────────────────────────────────────────
let _page = null;

function mkFrame(name, idx, bgHex) {
  const f = figma.createFrame();
  f.name = name; f.resize(W, H);
  f.x = idx * (W + GAP); f.y = 0;
  f.fills = [{ type: 'SOLID', color: hex(bgHex) }];
  f.clipsContent = true;
  if (_page) _page.appendChild(f);
  return f;
}

function rct(p, x, y, w, h, fillHex, op = 1, r = 0, strokeHex = null, sOp = 0.15) {
  const n = figma.createRectangle();
  n.x = x; n.y = y; n.resize(Math.max(w, 1), Math.max(h, 1));
  n.fills = [{ type: 'SOLID', color: hex(fillHex), opacity: op }];
  if (r) n.cornerRadius = r;
  if (strokeHex) {
    n.strokes = [{ type: 'SOLID', color: hex(strokeHex), opacity: sOp }];
    n.strokeWeight = 1; n.strokeAlign = 'INSIDE';
  }
  p.appendChild(n); return n;
}

function txt(p, x, y, w, content, size, font, fillHex, op = 1, lh = 140, tr = -2) {
  if (!content) return null;
  const t = figma.createText();
  t.fontName = font; t.fontSize = size; t.characters = String(content);
  t.fills = [{ type: 'SOLID', color: hex(fillHex), opacity: op }];
  t.lineHeight = { value: lh, unit: 'PERCENT' };
  t.letterSpacing = { value: tr, unit: 'PERCENT' };
  if (w) { t.resize(w, 100); t.textAutoResize = 'HEIGHT'; }
  else   { t.textAutoResize = 'WIDTH_AND_HEIGHT'; }
  t.x = x; t.y = y; p.appendChild(t); return t;
}

function placeholder(p, x, y, w, h, label = 'Image') {
  const f = figma.createFrame();
  f.name = `[ ${label} ]`; f.x = x; f.y = y; f.resize(w, h);
  f.fills = [{ type: 'SOLID', color: hex('#888888'), opacity: 0.1 }];
  f.strokes = [{ type: 'SOLID', color: hex('#888888'), opacity: 0.35 }];
  f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
  f.dashPattern = [6, 4]; f.cornerRadius = 8;
  p.appendChild(f); return f;
}

// ─── 레이아웃 렌더러 ─────────────────────────────────────────────────────────

function renderTitle(f, el, C, fn) {
  rct(f, W - 300, -60, 420, 420, C.accent, 0.06, 210);
  let y = PY;
  if (el.eyebrow) { txt(f, PX, y, W-2*PX, el.eyebrow, 11, fn.semi, C.accent, 1, 100, 18); y += 36; }
  if (el.title) {
    const t = txt(f, PX, y, W-2*PX-160, el.title, 58, fn.black, C.text, 1, 115, -2.5);
    y += (t ? t.height : 130) + 36;
  }
  rct(f, PX, y, 40, 1, C.text, 0.2); y += 24;
  if (el.subtitle) { txt(f, PX, y, 640, el.subtitle, 20, fn.reg, C.muted, 1, 160, 0); y += 56; }
  if (el.authorName) {
    txt(f, PX, y, 400, el.authorName, 14, fn.semi, C.text, 0.6, 100, 0);
    if (el.authorRole) txt(f, PX + 180, y + 1, 400, el.authorRole, 13, fn.reg, C.text, 0.3, 100, 0);
  } else if (el.meta) {
    txt(f, PX, y, 400, el.meta, 14, fn.reg, C.muted, 1, 100, 0);
  }
}

function renderSection(f, el, C, fn) {
  f.fills = [{ type: 'SOLID', color: hex(C.accent) }];
  const W_ = '#ffffff';
  if (el.sectionNumber) {
    const t = figma.createText(); t.fontName = fn.black; t.fontSize = 200;
    t.characters = el.sectionNumber;
    t.fills = [{ type: 'SOLID', color: hex(W_), opacity: 0.1 }];
    t.textAutoResize = 'WIDTH_AND_HEIGHT'; t.x = W/2 - 100; t.y = H/2 - 180; f.appendChild(t);
  }
  let y = H/2 - 60;
  if (el.sectionLabel) { txt(f, PX, y-36, W-2*PX, el.sectionLabel, 12, fn.semi, W_, 0.7, 100, 18); }
  const title = el.sectionTitle || el.title || '';
  if (title) { txt(f, PX, y, W-2*PX, title, 48, fn.bold, W_, 1, 120, -2); y += 80; }
  if (el.sectionDesc) { txt(f, PX, y, W-2*PX, el.sectionDesc, 20, fn.reg, W_, 0.75, 160, 0); }
}

function renderContent(f, el, C, fn) {
  let y = PY;
  if (el.eyebrow) { txt(f, PX, y, W-2*PX, el.eyebrow, 11, fn.semi, C.accent, 1, 100, 18); y += 28; }
  if (el.title)   { txt(f, PX, y, W-2*PX, el.title,   36, fn.bold,  C.text,   1, 120, -2); y += 52; }
  rct(f, PX, y, 40, 4, C.accent, 1, 99); y += 28;

  if (el.cards && el.cards.length) {
    const n = Math.min(el.cards.length, 3), g = 20;
    const cw = (W - 2*PX - g*(n-1)) / n, ch = H - y - PY;
    el.cards.slice(0, n).forEach((c, i) => {
      const cx = PX + i*(cw+g);
      rct(f, cx, y, cw, ch, C.surface, 1, 12, C.border, 1);
      let ty = y + 24;
      if (c.stat)  { txt(f, cx+20, ty, cw-40, c.stat,  36, fn.black, C.accent, 1, 110, -2); ty += 56; }
      if (c.title) { txt(f, cx+20, ty, cw-40, c.title, 15, fn.semi,  C.text,   1, 140, -1); ty += 32; }
      if (c.body)  { txt(f, cx+20, ty, cw-40, c.body,  13, fn.reg,   C.muted,  1, 160,  0); }
    });
    return;
  }
  if (el.listItems && el.listItems.length) {
    el.listItems.forEach(item => {
      rct(f, PX, y+8, 8, 8, C.accent, 1, 4);
      txt(f, PX+24, y, W-2*PX-24, item, 20, fn.reg, C.text, 1, 160, 0);
      y += 48;
    });
    return;
  }
  if (el.callout) {
    rct(f, PX, y, W-2*PX, 64, C.accentBg, 1, 8);
    rct(f, PX, y, 4, 64, C.accent, 1);
    txt(f, PX+20, y+20, W-2*PX-32, el.callout, 18, fn.semi, C.text, 1, 140, 0);
    return;
  }
  placeholder(f, PX, y, W-2*PX, H-y-PY, 'Content');
}

function renderTwoCol(f, el, C, fn) {
  let y = PY;
  const mid = W/2 - PX/2, cw = mid - PX;
  if (el.eyebrow) { txt(f, PX, y, W-2*PX, el.eyebrow, 11, fn.semi, C.accent, 1, 100, 18); y += 28; }
  if (el.title)   { txt(f, PX, y, W-2*PX, el.title,   36, fn.bold,  C.text,   1, 120, -2); y += 52; }
  rct(f, PX, y, 40, 4, C.accent, 1, 99); y += 28;

  const bodyH = H - y - PY;
  const ct = el.colTitles || [];
  const rx = PX + mid;

  // 좌
  if (ct[0]) { txt(f, PX, y, cw, ct[0], 13, fn.semi, C.accent, 1, 100, 10); }
  const lTop = y + (ct[0] ? 28 : 0);
  if (el.listItems && el.listItems.length) {
    let ly = lTop;
    el.listItems.slice(0, 4).forEach(item => {
      rct(f, PX, ly+8, 8, 8, C.accent, 1, 4);
      txt(f, PX+20, ly, cw-20, item, 16, fn.reg, C.text, 1, 160, 0);
      ly += 40;
    });
  } else {
    placeholder(f, PX, lTop, cw, bodyH-(ct[0]?28:0), 'Left');
  }

  // 우
  if (ct[1]) { txt(f, rx, y, cw, ct[1], 13, fn.semi, C.accent, 1, 100, 10); }
  const rTop = y + (ct[1] ? 28 : 0);
  if (el.cards && el.cards.length) {
    let cy = rTop;
    const ch = Math.min((bodyH-(ct[1]?28:0)) / el.cards.length - 12, 120);
    el.cards.slice(0, 4).forEach(c => {
      rct(f, rx, cy, cw, ch, C.surface, 1, 10, C.border, 1);
      let ty = cy + 16;
      if (c.title) { txt(f, rx+16, ty, cw-32, c.title, 14, fn.semi, C.text,  1, 130, -1); ty += 26; }
      if (c.body)  { txt(f, rx+16, ty, cw-32, c.body,  12, fn.reg,  C.muted, 1, 150,  0); }
      cy += ch + 12;
    });
  } else {
    placeholder(f, rx, rTop, cw, bodyH-(ct[1]?28:0), 'Right');
  }
}

function renderQuote(f, el, C, fn) {
  const cx = PX * 2;
  txt(f, cx-20, H/2-140, 80, '"', 120, fn.bold, C.accent, 0.3, 100, 0);
  if (el.quoteText)   txt(f, cx, H/2-60, W-cx*2, el.quoteText,         32, fn.semi, C.text,  1, 150, -2);
  if (el.quoteAuthor) txt(f, cx, H/2+80, W-cx*2, '— ' + el.quoteAuthor, 16, fn.reg,  C.muted, 1, 100,  0);
  if (el.quoteSource) txt(f, cx, H/2+108, W-cx*2, el.quoteSource,       13, fn.reg,  C.light, 1, 100,  0);
}

function renderImage(f, el, C, fn) {
  placeholder(f, 0, 0, W, H, 'Full Image');
  if (el.title || el.subtitle) {
    rct(f, 0, H-180, W, 180, '#000000', 0.55);
    if (el.title)    txt(f, PX, H-140, W-2*PX, el.title,    28, fn.bold, '#ffffff', 1, 120, -1);
    if (el.subtitle) txt(f, PX, H-100, W-2*PX, el.subtitle, 16, fn.reg,  '#ffffff', 0.75, 100, 0);
  }
}

function renderClosing(f, el, C, fn) {
  f.fills = [{ type: 'SOLID', color: hex(C.text) }];
  let y = H/2 - 60;
  const W_ = C.bg;
  if (el.closingTitle || el.title)
    txt(f, PX, y, W-2*PX, el.closingTitle || el.title, 52, fn.black, W_, 1, 115, -3);
  y += 80;
  if (el.closingSubtitle || el.subtitle)
    txt(f, PX, y, W-2*PX, el.closingSubtitle || el.subtitle, 22, fn.reg, W_, 0.5, 160, 0);
  y += 50;
  if (el.closingContact)
    txt(f, PX, y, W-2*PX, el.closingContact, 16, fn.reg, W_, 0.35, 100, 0);
}

function renderSlide(slide, idx) {
  const C  = THEMES[slide.theme] || THEMES['default'];
  const fn = fonts(slide.theme);
  const el = slide.elements || {};
  const label = `${String(idx+1).padStart(2,'0')} — ${slide.file.replace('.html','')}`;
  const f = mkFrame(label, idx, C.bg);

  switch (slide.layout) {
    case 'layout-title':   renderTitle(f, el, C, fn);   break;
    case 'layout-section': renderSection(f, el, C, fn); break;
    case 'layout-content': renderContent(f, el, C, fn); break;
    case 'layout-two-col': renderTwoCol(f, el, C, fn);  break;
    case 'layout-quote':   renderQuote(f, el, C, fn);   break;
    case 'layout-image':   renderImage(f, el, C, fn);   break;
    case 'layout-closing': renderClosing(f, el, C, fn); break;
    default:               renderContent(f, el, C, fn); break;
  }
}

// ─── 메시지 핸들러 ───────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'generate') return;
  if (!SLIDE_DATA) {
    figma.ui.postMessage({ error: true, text: '슬라이드 데이터가 없습니다. Claude Code에 피그마 변환을 요청하세요.' });
    return;
  }
  try {
    await loadFonts();
    _page = figma.createPage();
    _page.name = SLIDE_DATA.project || 'ppt-maker';
    for (let i = 0; i < SLIDE_DATA.slides.length; i++) {
      figma.ui.postMessage({ progress: `${i+1} / ${SLIDE_DATA.slides.length}` });
      renderSlide(SLIDE_DATA.slides[i], i);
    }
    figma.viewport.scrollAndZoomIntoView(_page.children);
    figma.ui.postMessage({ done: true, text: `✅ ${SLIDE_DATA.slides.length}개 완료` });
  } catch(e) {
    figma.ui.postMessage({ error: true, text: `오류: ${e.message}` });
  }
};
