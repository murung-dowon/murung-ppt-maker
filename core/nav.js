/**
 * nav.js — 슬라이드 네비게이션 엔진
 * slides.json을 읽어 현재 슬라이드 순서를 파악하고
 * 키보드(← →) + 화면 버튼으로 이동합니다.
 */
(function () {
  'use strict';

  // ── 슬라이드 파일명 추출 ──────────────────────────────
  // 경로 구조: [project]/slide-XX.html → project 폴더의 slides.json 참조
  const pathParts = window.location.pathname.split('/');
  const currentFile = pathParts[pathParts.length - 1]; // e.g. "slide-01-title.html"

  // slides.json은 현재 파일과 같은 디렉토리에 있음
  const slidesJsonPath = './slides.json';

  // ── 슬라이드 스케일링 (1280×720 → 현재 화면 크기 맞춤) ──
  function scaleSlide() {
    const slide = document.querySelector('.slide');
    if (!slide) return;

    const slideW = 1280;
    const slideH = 720;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 여백 32px
    const scaleX = (vw - 32) / slideW;
    const scaleY = (vh - 32) / slideH;
    const scale = Math.min(scaleX, scaleY);

    slide.style.transform = `scale(${scale})`;
    slide.style.transformOrigin = 'center center';
  }

  window.addEventListener('resize', scaleSlide);
  scaleSlide();

  // ── slides.json fetch & 네비게이션 생성 ─────────────
  fetch(slidesJsonPath)
    .then(r => r.json())
    .then(slides => {
      const idx = slides.findIndex(s => s.file === currentFile);
      if (idx === -1) return; // slides.json에 없으면 네비게이션 없음

      const total = slides.length;
      const prevSlide = idx > 0 ? slides[idx - 1] : null;
      const nextSlide = idx < total - 1 ? slides[idx + 1] : null;

      buildNav(prevSlide, nextSlide, idx + 1, total);
      attachKeyboard(prevSlide, nextSlide);
    })
    .catch(() => {
      // slides.json 없으면 조용히 무시 (단독 열람 지원)
    });

  // ── 네비게이션 DOM 생성 ──────────────────────────────
  function buildNav(prev, next, current, total) {
    const nav = document.createElement('div');
    nav.id = 'slide-nav';

    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-btn';
    prevBtn.innerHTML = '&#8592;';
    prevBtn.title = prev ? prev.title : '첫 번째 슬라이드';
    prevBtn.disabled = !prev;
    if (prev) prevBtn.addEventListener('click', () => navigate(prev.file));

    // 슬라이드 번호
    const counter = document.createElement('span');
    counter.className = 'nav-counter';
    counter.textContent = `${current} / ${total}`;

    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-btn';
    nextBtn.innerHTML = '&#8594;';
    nextBtn.title = next ? next.title : '마지막 슬라이드';
    nextBtn.disabled = !next;
    if (next) nextBtn.addEventListener('click', () => navigate(next.file));

    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);
    document.body.appendChild(nav);
  }

  // ── 키보드 이벤트 ────────────────────────────────────
  function attachKeyboard(prev, next) {
    document.addEventListener('keydown', (e) => {
      // 편집 모드 중엔 키보드 네비게이션 비활성
      if (document.body.classList.contains('editor-active')) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (prev) navigate(prev.file);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          if (next) navigate(next.file);
          break;
        case 'Home':
          e.preventDefault();
          fetch('./slides.json')
            .then(r => r.json())
            .then(slides => navigate(slides[0].file));
          break;
        case 'End':
          e.preventDefault();
          fetch('./slides.json')
            .then(r => r.json())
            .then(slides => navigate(slides[slides.length - 1].file));
          break;
      }
    });
  }

  // ── 슬라이드 이동 ────────────────────────────────────
  function navigate(file) {
    window.location.href = `./${file}`;
  }
})();
