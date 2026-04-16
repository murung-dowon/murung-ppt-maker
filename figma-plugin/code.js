// ppt-maker → Figma Plugin
// Claude Code가 아래 SLIDE_DATA를 프로젝트 데이터로 업데이트한 뒤
// Figma에서 플러그인 실행 → Generate 버튼 한 번으로 슬라이드 생성

// ─── SLIDE_DATA (Claude Code가 자동 업데이트하는 영역) ──────────────────────
// [SLIDE_DATA_START]
const SLIDE_DATA = {"project":"week7-git","slides":[{"index":0,"file":"slide-01-terminal.html","layout":"layout-image","theme":"","elements":{"eyebrow":"1. Git Terminal","meta":"오픈소스 SW  |  201900614 김도원","title":"터미널 명령어 실행 결과","subtitle":"ls, cd, git remote -v 명령어 수행 후 캡처","placeholderLabel":"터미널 캡처 이미지 삽입"}},{"index":1,"file":"slide-02-github.html","layout":"layout-image","theme":"","elements":{"eyebrow":"2. Remote Repository","meta":"오픈소스 SW  |  201900614 김도원","title":"원격 저장소 Push 확인","subtitle":"c.txt 생성 후 GitHub 원격 저장소에 push한 결과","placeholderLabel":"GitHub 저장소 캡처 이미지 삽입"}},{"index":2,"file":"slide-03-conflict1.html","layout":"layout-two-col","theme":"","elements":{"eyebrow":"3. Git 협업 — 상황 1","title":"팀원과 다른 파일을 수정한 뒤 Push할 때","colTitles":["문제","해결"],"cards":[{"eyebrow":"Push 거부 발생","body":"팀원이 먼저 push했기 때문에 원격 저장소의 히스토리가 내 로컬보다 앞서 있는 상태. 파일 내용 충돌은 없지만 Git이 push를 거부합니다."},{"eyebrow":"Pull 후 다시 Push","body":"원격 변경사항을 먼저 받아온 뒤 push합니다.","code":"git pull\ngit push"}],"callout":"서로 다른 파일이므로 자동 병합 — 수동 수정 없이 바로 완료"}},{"index":3,"file":"slide-04-conflict2.html","layout":"layout-content","theme":"","elements":{"eyebrow":"4. Git 협업 — 상황 2","title":"팀원과 같은 파일을 수정한 뒤 Push할 때","steps":[{"num":"1","title":"git pull 실행","body":"원격 변경사항 가져오기 — 충돌 마커 자동 삽입됨"},{"num":"2","title":"파일 직접 편집","body":"충돌 마커 제거 후 최종 내용 확정"},{"num":"3","title":"병합 커밋 생성","body":"git add → git commit"},{"num":"4","title":"git push","body":"정상적으로 업로드 완료"}],"codeBlock":"<<<<<<< HEAD  (나의 수정 내용)\n=======\n팀원의 수정 내용\n>>>>>>> origin/main","callout":"충돌 마커를 제거하고 최종 내용만 남긴 뒤 커밋 — Git이 자동 병합 불가한 경우 반드시 수동 해결"}}]};
// [SLIDE_DATA_END]
// ─────────────────────────────────────────────────────────────────────────────

figma.showUI(__html__, { width: 300, height: 280 });

if (SLIDE_DATA) {
  figma.ui.postMessage({ type: 'ready', project: SLIDE_DATA.project, count: SLIDE_DATA.slides.length });
} else {
  figma.ui.postMessage({ type: 'no-data' });
}

// ─── 상수 ────────────────────────────────────────────────────────────────────
const W = 1280, H = 720, GAP = 120;
const PX = 80, PY = 64;

// ─── 테마 색상표 ─────────────────────────────────────────────────────────────
const THEMES = {
  'default':      { bg:'#ffffff', surface:'#f8f9fa', text:'#1a1a1a', muted:'#6b7280', light:'#9ca3af', accent:'#2563eb', accentBg:'#eff6ff', accentLight:'#dbeafe', border:'#e5e7eb' },
  'theme-dark':   { bg:'#0d0c0a', surface:'#1a1917', text:'#f0ede8', muted:'#9c9690', light:'#5a5550', accent:'#63b3ed', accentBg:'#1a2a3a', accentLight:'#2a4a6a', border:'#2a2825' },
  'theme-tech':   { bg:'#0f172a', surface:'#1e293b', text:'#f1f5f9', muted:'#94a3b8', light:'#64748b', accent:'#06b6d4', accentBg:'#0c2a32', accentLight:'#164e63', border:'#1e293b' },
  'theme-minimal':{ bg:'#fafaf9', surface:'#f5f5f4', text:'#0a0a0a', muted:'#57534e', light:'#a8a29e', accent:'#0a0a0a', accentBg:'#f5f5f4', accentLight:'#e7e5e4', border:'#e7e5e4' },
  'theme-warm':   { bg:'#fffbeb', surface:'#fef3c7', text:'#1c1917', muted:'#78716c', light:'#a8a29e', accent:'#d97706', accentBg:'#fef3c7', accentLight:'#fde68a', border:'#fde68a' },
};

// ─── 색상 헬퍼 ───────────────────────────────────────────────────────────────
function hex(h) {
  const n = parseInt(h.replace('#',''), 16);
  return { r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 };
}

// ─── 폰트 ────────────────────────────────────────────────────────────────────
// Noto Sans KR supports Korean glyphs; Inter does not.
// Using Noto Sans KR as primary to prevent blank text until double-click.
const F = {
  reg:   { family:'Noto Sans KR', style:'Regular' },
  med:   { family:'Noto Sans KR', style:'Medium'  },
  semi:  { family:'Noto Sans KR', style:'Medium'  },
  bold:  { family:'Noto Sans KR', style:'Bold'    },
  black: { family:'Noto Sans KR', style:'Black'   },
  gReg:  { family:'Georgia',      style:'Regular' },
  gBold: { family:'Georgia',      style:'Bold'    },
};

async function loadFonts() {
  // Load Noto Sans KR variants; fall back gracefully if a weight is missing
  await Promise.allSettled(Object.values(F).map(f => figma.loadFontAsync(f)));
}

function fonts(theme) {
  const m = theme === 'theme-minimal';
  return {
    reg:   m ? F.gReg  : F.reg,
    med:   m ? F.gBold : F.med,
    semi:  m ? F.gBold : F.semi,
    bold:  m ? F.gBold : F.bold,
    black: m ? F.gBold : F.black,
  };
}

// ─── 기본 노드 헬퍼 ──────────────────────────────────────────────────────────
let _page = null;

function mkFrame(name, idx, bgHex) {
  const f = figma.createFrame();
  f.name = name; f.resize(W, H);
  f.x = idx * (W + GAP); f.y = 0;
  f.fills = [{ type:'SOLID', color:hex(bgHex) }];
  f.clipsContent = true;
  if (_page) _page.appendChild(f);
  return f;
}

function rct(p, x, y, w, h, fillHex, op=1, r=0, strokeHex=null, sOp=1) {
  const n = figma.createRectangle();
  n.x = x; n.y = y; n.resize(Math.max(w,1), Math.max(h,1));
  n.fills = [{ type:'SOLID', color:hex(fillHex), opacity:op }];
  if (r) n.cornerRadius = r;
  if (strokeHex) {
    n.strokes = [{ type:'SOLID', color:hex(strokeHex), opacity:sOp }];
    n.strokeWeight = 1; n.strokeAlign = 'INSIDE';
  }
  p.appendChild(n); return n;
}

function txt(p, x, y, w, content, size, font, fillHex, op=1, lh=140, tr=-2, align='LEFT') {
  if (!content && content !== 0) return null;
  const t = figma.createText();
  t.fontName = font; t.fontSize = size;
  t.characters = String(content);
  t.fills = [{ type:'SOLID', color:hex(fillHex), opacity:op }];
  t.lineHeight   = { value:lh, unit:'PERCENT' };
  t.letterSpacing = { value:tr, unit:'PERCENT' };
  t.textAlignHorizontal = align;
  if (w) { t.resize(w, 100); t.textAutoResize = 'HEIGHT'; }
  else   { t.textAutoResize = 'WIDTH_AND_HEIGHT'; }
  t.x = x; t.y = y;
  p.appendChild(t); return t;
}

function placeholder(p, x, y, w, h, label='Image') {
  const f = figma.createFrame();
  f.name = `[ ${label} ]`; f.x = x; f.y = y;
  f.resize(Math.max(w,1), Math.max(h,1));
  f.fills   = [{ type:'SOLID', color:hex('#888888'), opacity:0.08 }];
  f.strokes = [{ type:'SOLID', color:hex('#888888'), opacity:0.3  }];
  f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
  f.dashPattern = [6,4]; f.cornerRadius = 8;
  p.appendChild(f); return f;
}

// chips 행 그리기 헬퍼
function drawChips(f, chips, startX, y, C, fn) {
  let cx = startX;
  (chips || []).forEach(chip => {
    const cw = chip.length * 10 + 40;
    rct(f, cx, y, cw, 36, C.surface, 1, 18, C.border, 0.8);
    txt(f, cx+14, y+9, cw-28, chip, 13, fn.med, C.text, 1, 100, 0);
    cx += cw + 10;
  });
}

// ─── 레이아웃 렌더러 ─────────────────────────────────────────────────────────

function renderTitle(f, el, C, fn) {
  // layout-title 전용 패딩: 80px top, 100px sides (slide-base.css 기준)
  const tPX = 100, tPY = 80;
  // 우측 하단 장식 원 — CSS: right:-120 bottom:-120 width:480 height:480
  rct(f, W - 480 + 120, H - 480 + 120, 480, 480, C.accent, 0.08, 240);
  let y = tPY;
  // --font-size-small(16) + letter-spacing-wide(0.05em)
  if (el.eyebrow) { txt(f, tPX, y, W-2*tPX, el.eyebrow, 16, fn.semi, C.accent, 1, 100, 50); y += 40; }
  // --font-size-display(72) + line-height-tight(120%) + letter-spacing-tight(-3%)
  if (el.title) {
    const t = txt(f, tPX, y, 880, el.title, 72, fn.black, C.text, 1, 120, -3);
    y += (t ? t.height : 160) + 40;
  }
  rct(f, tPX, y, 40, 2, C.text, 0.2); y += 24;
  // --font-size-h3(28) + line-height-normal(160%)
  if (el.subtitle) { txt(f, tPX, y, 640, el.subtitle, 28, fn.reg, C.muted, 1, 160, 0); y += 80; }
  // --font-size-small(16)
  if (el.meta)     { txt(f, tPX, y, 400, el.meta, 16, fn.reg, C.muted, 0.7, 100, 0); }
}

function renderSection(f, el, C, fn) {
  f.fills = [{ type:'SOLID', color:hex(C.accent) }];
  const WHITE = '#ffffff';
  // 장식용 대형 글자 (title 첫 글자) — 오른쪽 절반에 배경 장식
  if (el.title) {
    const big = figma.createText();
    big.fontName = fn.black; big.fontSize = 320;
    big.characters = el.title.charAt(0);
    big.fills = [{ type:'SOLID', color:hex(WHITE), opacity:0.08 }];
    big.textAutoResize = 'WIDTH_AND_HEIGHT';
    f.appendChild(big);
    big.x = W/2 - 80; big.y = H/2 - 220;
  }
  // 중앙 배치: x=0, w=W, CENTER 정렬
  let y = H/2 - 72;
  if (el.sectionLabel) {
    const sl = txt(f, 0, y, W, el.sectionLabel, 12, fn.semi, WHITE, 0.7, 100, 18, 'CENTER');
    y += sl ? sl.height + 12 : 24;
  }
  if (el.title) {
    const tt = txt(f, 0, y, W, el.title, 52, fn.bold, WHITE, 1, 120, -2, 'CENTER');
    y += tt ? tt.height + 20 : 72;
  }
  if (el.desc) {
    txt(f, 0, y, W, el.desc, 20, fn.reg, WHITE, 0.75, 160, 0, 'CENTER');
  }
}

function renderContent(f, el, C, fn) {
  // ── 헤더 영역 ──────────────────────────────────────────────────────────────
  let y = PY;
  // --font-size-xs(13) eyebrow, --font-size-h2(38) title
  if (el.eyebrow) { txt(f, PX, y, W-2*PX, el.eyebrow, 13, fn.semi, C.accent, 1, 100, 50); y += 28; }
  if (el.title)   { txt(f, PX, y, W-2*PX, el.title,   38, fn.bold, C.text,   1, 120, -3); y += 56; }
  rct(f, PX, y, 40, 4, C.accent, 1, 99); y += 24;

  const bodyY = y;
  const bodyH = H - bodyY - PY;

  // ── STEPS (흐름 카드 + 이미지 플레이스홀더) ───────────────────────────────
  if (el.steps && el.steps.length) {
    const n = el.steps.length;
    const AW = 24, AG = 6;
    const stepW = Math.floor((W - 2*PX - (n-1)*(AW + AG*2)) / n);
    const codeLines  = el.codeBlock ? el.codeBlock.split('\n').length : 0;
    const calloutH   = el.callout   ? 60  : 0;
    const codeBlockH = el.codeBlock ? Math.max(codeLines * 23 + 28, 80) : 0;
    const extrasH    = calloutH + (calloutH ? 12 : 0) + codeBlockH + (codeBlockH ? 12 : 0);
    const hasAnyImg  = el.steps.some(s => s.hasImage);

    // 이미지 없는 step은 내용 높이 기준으로 상한 설정 (세로 늘어짐 방지)
    const stepsH = hasAnyImg
      ? bodyH - extrasH
      : Math.min(bodyH - extrasH, 220);

    // n >= 4이면 모든 카드 동일한 스타일(isLast 강조 없음), n <= 3이면 마지막 카드 accent
    const useLastAccent = n <= 3 && hasAnyImg;

    el.steps.forEach((step, i) => {
      const sx      = PX + i * (stepW + AW + AG*2);
      const imgH    = step.hasImage ? Math.floor(stepsH * 0.75) : 0;
      const cardY   = bodyY + imgH;
      const cardH   = stepsH - imgH;
      const isLast  = i === n - 1;
      const doAccent = useLastAccent && isLast;

      if (step.hasImage) placeholder(f, sx, bodyY, stepW, imgH, `이미지 ${i+1}`);

      rct(f, sx, cardY, stepW, cardH,
          doAccent ? C.accentBg : C.surface, 1, 12,
          doAccent ? C.accent   : C.border,  1);

      let ty = cardY + 16;
      // 스텝 번호: 원형 배지
      if (step.num !== undefined && step.num !== null) {
        const BADGE = 28;
        rct(f, sx+16, ty, BADGE, BADGE, C.accent, 1, 14);
        txt(f, sx+16, ty + Math.floor((BADGE-16)/2), BADGE, String(step.num), 13, fn.bold, '#ffffff', 1, 100, 0, 'CENTER');
        ty += BADGE + 10;
      }
      if (step.title) {
        const tt = txt(f, sx+16, ty, stepW-32, step.title, 17, fn.bold, C.text, 1, 130, -1);
        ty += (tt ? tt.height : 24) + 6;
      }
      if (step.body) txt(f, sx+16, ty, stepW-32, step.body, 13, fn.reg, C.muted, 1, 150, 0);

      if (i < n-1) {
        const ax = sx + stepW + AG;
        const ay = bodyY + Math.floor(stepsH/2) - 8;
        txt(f, ax, ay, AW, '\u2192', 13, fn.bold, C.accent, 0.7, 100, 0);
      }
    });

    let extraY = bodyY + stepsH + 12;

    // codeBlock: 다크 코드 블록 렌더링 (줄 수에 따라 높이 자동 계산)
    if (el.codeBlock) {
      rct(f, PX, extraY, W-2*PX, codeBlockH, '#1e293b', 1, 8);
      txt(f, PX+24, extraY+14, W-2*PX-48, el.codeBlock, 13, fn.semi, '#7dd3fc', 1, 175, 0);
      extraY += codeBlockH + 12;
    }

    if (el.callout) {
      rct(f, PX, extraY, W-2*PX, calloutH, C.accentBg, 1, 8, C.border, 0.5);
      rct(f, PX, extraY, 4, calloutH, C.accent, 1);
      txt(f, PX+20, extraY+18, W-2*PX-36, el.callout, 16, fn.semi, C.text, 1, 130, 0);
    }
    return;
  }

  // ── STAT + ITEMS (수치 강조 + 목록) ─────────────────────────────────────
  if (el.stat !== undefined) {
    const colW = Math.floor((W - 2*PX - 48) / 2);
    const rx   = PX + colW + 48;

    // 왼쪽: 수치
    const st = txt(f, PX, y, colW, el.stat, 96, fn.black, C.accent, 1, 100, -4);
    let ly = y + (st ? st.height : 108) + 8;
    if (el.statLabel) {
      txt(f, PX, ly, colW, el.statLabel, 18, fn.reg, C.muted, 1, 140, 0);
      ly += 36;
    }
    if (el.callout) {
      ly += 16;
      rct(f, PX, ly, colW, 64, C.accentBg, 1, 8, C.border, 0.5);
      rct(f, PX, ly, 4, 64, C.accent, 1);
      txt(f, PX+16, ly+14, colW-24, el.callout, 16, fn.semi, C.text, 1, 135, 0);
    }

    // 오른쪽: 항목 리스트
    if (el.items && el.items.length) {
      let iy = y;
      el.items.forEach(item => {
        const iw = W - 2*PX - colW - 48;
        rct(f, rx, iy, iw, 48, C.surface, 1, 8, C.border, 0.6);
        txt(f, rx+16, iy+14, iw-32, item, 16, fn.reg, C.muted, 1, 120, 0);
        iy += 56;
      });
    }
    return;
  }

  // ── CARDS ROWS (뱃지 + 가로 행) — cardLayout: "rows" ────────────────────
  // HTML: .level-row { grid: 56px badge + 1fr card }, badge circle 56px, font h3(28)
  // card: padding md(24) lg(40), label small(16), title h4(22), desc small(16)
  if (el.cards && el.cards.length && el.cardLayout === 'rows') {
    const BADGE = 56, BADGE_GAP = 24;
    const cardW  = W - 2*PX - BADGE - BADGE_GAP;
    const ROW_G  = 16;
    const rowH   = Math.floor((bodyH - ROW_G*(el.cards.length-1)) / el.cards.length);

    el.cards.forEach((c, i) => {
      const ry = bodyY + i*(rowH + ROW_G);
      const bx = PX, cardX = PX + BADGE + BADGE_GAP;
      const badgeCY = ry + rowH/2 - BADGE/2;

      // 뱃지 원
      const bs = c.badgeStyle || 'muted';
      const badgeBg     = bs === 'accent' ? C.accent : C.surface;
      const badgeStroke = bs === 'accent' ? null      : C.border;
      const badgeText   = bs === 'accent' ? '#ffffff' : (bs === 'outline' ? C.accent : C.muted);
      rct(f, bx, badgeCY, BADGE, BADGE, badgeBg, 1, BADGE/2, badgeStroke, 0.8);
      if (c.badge) txt(f, bx, badgeCY + (BADGE-28)/2, BADGE, c.badge, 28, fn.black, badgeText, 1, 100, -2, 'CENTER');

      // 카드 배경
      const isAccent = !!c.accent;
      rct(f, cardX, ry, cardW, rowH, isAccent ? C.accentBg : C.surface, 1, 16,
          isAccent ? C.accentLight : C.border, 0.8);

      // 카드 내용 — 수직 중앙 정렬
      const PAD = 24;
      let ty = ry + PAD;
      if (c.eyebrow) {
        txt(f, cardX+PAD, ty, cardW-PAD*2, c.eyebrow, 13, fn.semi, C.accent, 1, 100, 50);
        ty += 22;
      }
      if (c.title) {
        const tt = txt(f, cardX+PAD, ty, cardW-PAD*2, c.title, 22, fn.bold, C.text, 1, 130, -2);
        ty += (tt ? tt.height : 30) + 8;
      }
      if (c.body) txt(f, cardX+PAD, ty, cardW-PAD*2, c.body, 16, fn.reg, C.muted, 1, 160, 0);
    });
    return;
  }

  // ── CARDS GRID (+ 하단 chips) ─────────────────────────────────────────────
  if (el.cards && el.cards.length) {
    const chipsH    = (el.chips && el.chips.length) ? 52 : 0;
    const cardsAreaH = bodyH - chipsH - (chipsH ? 12 : 0);

    const n      = el.cards.length;
    // 1~3 → 1행, 4~6 → 2행
    const perRow = n <= 3 ? n : Math.ceil(n / 2);
    const rows   = Math.ceil(n / perRow);
    const g      = 16;
    const cw     = Math.floor((W - 2*PX - g*(perRow-1)) / perRow);
    const ch     = Math.floor((cardsAreaH - g*(rows-1)) / rows);

    el.cards.forEach((c, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const cx  = PX + col*(cw+g);
      const cy  = bodyY + row*(ch+g);

      rct(f, cx, cy, cw, ch, C.surface, 1, 12, C.border, 0.8);
      let ty = cy + 24;
      if (c.eyebrow) {
        txt(f, cx+24, ty, cw-48, c.eyebrow, 13, fn.semi, C.accent, 1, 100, 18);
        ty += 22;
      }
      if (c.title) {
        const tt = txt(f, cx+24, ty, cw-48, c.title, 18, fn.bold, C.text, 1, 130, -1);
        ty += (tt ? tt.height : 26) + 6;
      }
      if (c.body) txt(f, cx+24, ty, cw-48, c.body, 15, fn.reg, C.muted, 1, 150, 0);
    });

    // chips 띠
    if (chipsH) {
      const chipY = bodyY + cardsAreaH + 12;
      drawChips(f, el.chips, PX, chipY, C, fn);
    }
    return;
  }

  // ── BULLET LIST ───────────────────────────────────────────────────────────
  if (el.list && el.list.length) {
    el.list.forEach(item => {
      rct(f, PX, y+9, 8, 8, C.accent, 1, 4);
      txt(f, PX+24, y, W-2*PX-24, item, 20, fn.reg, C.text, 1, 160, 0);
      y += 48;
    });
    return;
  }

  // ── CALLOUT ONLY ──────────────────────────────────────────────────────────
  if (el.callout) {
    rct(f, PX, y, W-2*PX, 72, C.accentBg, 1, 8, C.border, 0.5);
    rct(f, PX, y, 4, 72, C.accent, 1);
    txt(f, PX+20, y+22, W-2*PX-32, el.callout, 20, fn.semi, C.text, 1, 140, 0);
    return;
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  placeholder(f, PX, bodyY, W-2*PX, bodyH, 'Content');
}

function renderTwoCol(f, el, C, fn) {
  let y = PY;
  const gap = 20;
  const colW = Math.floor((W - 2*PX - gap) / 2);
  const rx = PX + colW + gap;
  const ct = el.colTitles || [];

  if (el.eyebrow) { txt(f, PX, y, W-2*PX, el.eyebrow, 13, fn.semi, C.accent, 1, 100, 50); y += 28; }
  if (el.title)   { txt(f, PX, y, W-2*PX, el.title,   38, fn.bold, C.text,   1, 120, -3); y += 56; }
  rct(f, PX, y, 40, 4, C.accent, 1, 99); y += 24;

  const calloutH = el.callout ? 60 : 0;
  const bodyH = H - y - PY - (calloutH ? calloutH + 12 : 0);

  // ── 2장 카드 → 좌/우 분할 렌더링 ────────────────────────────────────────────
  if (el.cards && el.cards.length === 2 && !el.list) {
    const CARD_STYLES = [
      { bg: '#fff5f5', border: '#fca5a5', labelColor: '#dc2626' },
      { bg: '#eff6ff', border: '#bfdbfe', labelColor: C.accent  },
    ];
    el.cards.forEach((c, i) => {
      const cx  = i === 0 ? PX : rx;
      const cs  = CARD_STYLES[i];
      const colTitle = ct[i];
      let ty = y;
      if (colTitle) { txt(f, cx, ty, colW, colTitle, 13, fn.semi, cs.labelColor, 1, 100, 10); ty += 24; }
      const cardH = bodyH - (colTitle ? 24 : 0);
      rct(f, cx, ty, colW, cardH, cs.bg, 1, 12, cs.border, 1);
      let iy = ty + 24;
      if (c.eyebrow) { const t = txt(f, cx+20, iy, colW-40, c.eyebrow, 13, fn.semi, cs.labelColor, 1, 100, 10); iy += (t ? t.height : 18) + 10; }
      if (c.title)   { const t = txt(f, cx+20, iy, colW-40, c.title,   22, fn.bold, C.text,        1, 130, -1); iy += (t ? t.height : 30) + 10; }
      if (c.body)    { const t = txt(f, cx+20, iy, colW-40, c.body,    15, fn.reg,  C.muted,       1, 160,  0); iy += (t ? t.height : 60) + 14; }
      if (c.code) {
        rct(f, cx+20, iy, colW-40, 56, '#1e293b', 1, 8);
        txt(f, cx+36, iy+10, colW-72, c.code, 14, fn.semi, '#7dd3fc', 1, 160, 0);
      }
    });
  } else {
    // ── 원래 동작: 왼쪽=list, 오른쪽=cards ────────────────────────────────────
    if (ct[0]) { txt(f, PX, y, colW, ct[0], 13, fn.semi, C.accent, 1, 100, 10); }
    const lTop = y + (ct[0] ? 28 : 0);
    if (el.list && el.list.length) {
      let ly = lTop;
      el.list.slice(0,5).forEach(item => {
        rct(f, PX, ly+8, 8, 8, C.accent, 1, 4);
        txt(f, PX+20, ly, colW-20, item, 16, fn.reg, C.text, 1, 160, 0);
        ly += 40;
      });
    } else {
      placeholder(f, PX, lTop, colW, bodyH-(ct[0]?28:0), 'Left');
    }
    if (ct[1]) { txt(f, rx, y, colW, ct[1], 13, fn.semi, C.accent, 1, 100, 10); }
    const rTop = y + (ct[1] ? 28 : 0);
    if (el.cards && el.cards.length) {
      let cy = rTop;
      const ch = Math.min((bodyH-(ct[1]?28:0)) / el.cards.length - 12, 120);
      el.cards.slice(0,4).forEach(c => {
        rct(f, rx, cy, colW, ch, C.surface, 1, 10, C.border, 0.8);
        let ty = cy + 18;
        if (c.eyebrow) { txt(f, rx+18, ty, colW-36, c.eyebrow, 12, fn.semi, C.accent, 1, 100, 10); ty += 20; }
        if (c.title)   { txt(f, rx+18, ty, colW-36, c.title,   17, fn.semi, C.text,   1, 130, -1); ty += 28; }
        if (c.body)    { txt(f, rx+18, ty, colW-36, c.body,    14, fn.reg,  C.muted,  1, 150,  0); }
        cy += ch + 12;
      });
    } else {
      placeholder(f, rx, rTop, colW, bodyH-(ct[1]?28:0), 'Right');
    }
  }

  // ── Callout ────────────────────────────────────────────────────────────────
  if (el.callout) {
    const cy = H - PY - calloutH;
    rct(f, PX, cy, W-2*PX, calloutH, C.accentBg, 1, 8, C.border, 0.5);
    rct(f, PX, cy, 4, calloutH, C.accent, 1);
    txt(f, PX+20, cy+18, W-2*PX-36, el.callout, 16, fn.semi, C.text, 1, 130, 0);
  }
}

function renderQuote(f, el, C, fn) {
  // layout-quote: padding 80px 120px, text-align center
  // quote-text: --font-size-h2(38), source: --font-size-body(20) + muted
  txt(f, 0, H/2-180, W, '\u201C', 120, fn.bold, C.accent, 0.2, 100, 0, 'CENTER');
  if (el.quote)  txt(f, 120, H/2-60, W-240, el.quote,  38, fn.semi, C.text,  1,   160, -3, 'CENTER');
  if (el.source) txt(f, 120, H/2+100, W-240, el.source, 20, fn.reg,  C.muted, 0.8, 160,  0, 'CENTER');
}

function renderImage(f, el, C, fn) {
  // 헤더: eyebrow(좌) + meta(우) → title → subtitle → 대형 이미지 플레이스홀더
  let y = PY;
  if (el.eyebrow || el.meta) {
    if (el.eyebrow) txt(f, PX,       y, (W-2*PX)*0.55, el.eyebrow, 13, fn.semi, C.accent, 1, 100, 50);
    if (el.meta)    txt(f, PX, y, W-2*PX, el.meta, 13, fn.reg, C.muted, 1, 100, 0, 'RIGHT');
    y += 28;
  }
  if (el.title)   { const t = txt(f, PX, y, W-2*PX, el.title,   38, fn.bold, C.text,  1, 120, -3); y += (t ? t.height : 56) + 8; }
  if (el.subtitle){ const t = txt(f, PX, y, W-2*PX, el.subtitle, 16, fn.reg,  C.muted, 1, 150,  0); y += (t ? t.height : 24) + 20; }
  // 이미지 플레이스홀더 — 나머지 공간 전체 사용
  const phH = H - y - PY;
  placeholder(f, PX, y, W-2*PX, phH, el.placeholderLabel || '이미지 삽입');
}

function renderClosing(f, el, C, fn) {
  // layout-closing: bg=color-text, text-align center
  // closing-title: --font-size-h1(52) black, closing-subtitle: --font-size-h3(28) light
  f.fills = [{ type:'SOLID', color:hex(C.text) }];
  const W_ = C.bg;
  let y = H/2 - 90;
  if (el.title)    { const t = txt(f, 0, y, W, el.title,    52, fn.black, W_, 1,   120, -3, 'CENTER'); y += (t ? t.height : 74) + 20; }
  if (el.subtitle) { const t = txt(f, 0, y, W, el.subtitle, 28, fn.reg,   W_, 0.55, 160, 0, 'CENTER'); y += (t ? t.height : 40) + 36; }
  // chips — 전체 너비 계산 후 가운데 배치
  if (el.chips && el.chips.length) {
    const chipW   = chip => chip.length * 9 + 40;
    const totalW  = el.chips.reduce((s, c) => s + chipW(c) + 12, -12);
    let cx = Math.max(PX, (W - totalW) / 2);
    el.chips.forEach(chip => {
      const cw = chipW(chip);
      rct(f, cx, y, cw, 40, '#ffffff', 0.08, 20);
      txt(f, cx+16, y+11, cw-32, chip, 14, fn.reg, W_, 0.7, 100, 0);
      cx += cw + 12;
    });
  }
}

function renderSlide(slide, idx) {
  const C  = THEMES[slide.theme] || THEMES['default'];
  const fn = fonts(slide.theme);
  const el = slide.elements || {};
  const label = `${String(idx+1).padStart(2,'0')} \u2014 ${slide.file.replace('.html','')}`;
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
    figma.ui.postMessage({ error:true, text:'슬라이드 데이터가 없습니다. Claude Code에 피그마 변환을 요청하세요.' });
    return;
  }
  try {
    await loadFonts();
    _page = figma.createPage();
    _page.name = SLIDE_DATA.project || 'ppt-maker';
    for (let i = 0; i < SLIDE_DATA.slides.length; i++) {
      figma.ui.postMessage({ progress:`${i+1} / ${SLIDE_DATA.slides.length}` });
      renderSlide(SLIDE_DATA.slides[i], i);
    }
    figma.viewport.scrollAndZoomIntoView(_page.children);
    figma.ui.postMessage({ done:true, text:`✅ ${SLIDE_DATA.slides.length}개 완료` });
  } catch(e) {
    figma.ui.postMessage({ error:true, text:`오류: ${e.message}` });
  }
};
