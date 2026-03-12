/**
 * editor.js — 브라우저 인라인 편집기 (순수 JavaScript)
 * E 키 또는 우측 상단 버튼으로 편집 모드 토글
 *
 * 기능:
 *  - 텍스트 인라인 편집 (contenteditable)
 *  - Bold / Italic / Underline / 폰트 크기 / 색상
 *  - 애니메이션 6종 적용
 *  - Undo / Redo (Ctrl+Z / Ctrl+Y)
 *  - HTML 내보내기
 */
(function () {
  'use strict';

  // ── 상태 ──────────────────────────────────────────────
  let isEditorActive = false;
  const history = [];  // undo 스택
  const redoStack = []; // redo 스택
  const MAX_HISTORY = 50;

  // ── DOM 준비 후 초기화 ────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    buildToggleButton();
    buildToolbar();
    buildAnimPanel();
    buildToast();
    attachKeyboard();
    markEditableElements();
  }

  // ── 편집 모드 토글 버튼 ──────────────────────────────
  function buildToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'editor-toggle';
    btn.innerHTML = '<span class="toggle-dot"></span> 편집 모드';
    btn.title = 'E 키로 토글';
    btn.addEventListener('click', toggleEditor);
    document.body.appendChild(btn);
  }

  function toggleEditor() {
    isEditorActive = !isEditorActive;
    document.body.classList.toggle('editor-active', isEditorActive);

    const btn = document.getElementById('editor-toggle');
    btn.innerHTML = isEditorActive
      ? '<span class="toggle-dot"></span> 편집 중'
      : '<span class="toggle-dot"></span> 편집 모드';

    if (isEditorActive) {
      enableEditing();
    } else {
      disableEditing();
    }
  }

  // ── 편집 가능 요소 마킹 ──────────────────────────────
  function markEditableElements() {
    const slide = document.querySelector('.slide');
    if (!slide) return;

    // 텍스트 노드가 있는 요소에 data-editable 추가
    const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span', 'div'];
    textTags.forEach(tag => {
      slide.querySelectorAll(tag).forEach(el => {
        if (el.children.length === 0 || el.textContent.trim()) {
          el.setAttribute('data-editable', 'true');
        }
      });
    });
  }

  // ── 편집 활성 ─────────────────────────────────────────
  function enableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'true';
      el.addEventListener('focus', onFocusEditable);
      el.addEventListener('blur', onBlurEditable);
      el.addEventListener('input', onInput);
    });
    saveSnapshot(); // 현재 상태 스냅샷
  }

  function disableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.contentEditable = 'false';
      el.removeEventListener('focus', onFocusEditable);
      el.removeEventListener('blur', onBlurEditable);
    });
    clearToolbarState();
  }

  let currentTarget = null;

  function onFocusEditable(e) {
    currentTarget = e.target;
    updateToolbarState();
  }

  function onBlurEditable() {
    currentTarget = null;
    clearToolbarState();
  }

  function onInput() {
    // 디바운스 스냅샷
    clearTimeout(onInput._timer);
    onInput._timer = setTimeout(saveSnapshot, 500);
  }

  // ── Undo / Redo ──────────────────────────────────────
  function saveSnapshot() {
    const slide = document.querySelector('.slide');
    if (!slide) return;
    const snap = slide.innerHTML;
    if (history.length && history[history.length - 1] === snap) return;
    history.push(snap);
    if (history.length > MAX_HISTORY) history.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (history.length <= 1) { showToast('더 이상 실행 취소할 수 없습니다'); return; }
    const current = history.pop();
    redoStack.push(current);
    const prev = history[history.length - 1];
    restoreSnapshot(prev);
    showToast('실행 취소');
  }

  function redo() {
    if (!redoStack.length) { showToast('다시 실행할 내용이 없습니다'); return; }
    const next = redoStack.pop();
    history.push(next);
    restoreSnapshot(next);
    showToast('다시 실행');
  }

  function restoreSnapshot(html) {
    const slide = document.querySelector('.slide');
    if (!slide) return;
    slide.innerHTML = html;
    if (isEditorActive) {
      markEditableElements();
      enableEditing();
    }
  }

  // ── 포맷 툴바 (상단 가로) ────────────────────────────
  function buildToolbar() {
    const tb = document.createElement('div');
    tb.id = 'editor-toolbar';

    tb.innerHTML = `
      <!-- 편집 모드 표시 -->
      <div class="toolbar-section">
        <span style="font-size:11px;font-weight:700;color:#2563eb;white-space:nowrap;letter-spacing:-0.01em;">✏️ 편집 중</span>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 서식 -->
      <div class="toolbar-section">
        <span class="toolbar-label">서식</span>
        <button class="tb-btn" id="tb-bold"   title="굵게 (Ctrl+B)"><b>B</b></button>
        <button class="tb-btn" id="tb-italic" title="기울임 (Ctrl+I)"><i>I</i></button>
        <button class="tb-btn" id="tb-under"  title="밑줄 (Ctrl+U)"><u>U</u></button>
        <button class="tb-btn" id="tb-strike" title="취소선">S̶</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 폰트 크기 -->
      <div class="toolbar-section">
        <span class="toolbar-label">크기</span>
        <button class="tb-btn" id="tb-font-dec" title="크기 줄이기">A−</button>
        <input class="tb-input" id="tb-font-size" type="number" min="8" max="200" placeholder="px">
        <button class="tb-btn" id="tb-font-inc" title="크기 키우기">A+</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 색상 -->
      <div class="toolbar-section">
        <span class="toolbar-label">색상</span>
        <span style="font-size:11px;color:#9ca3af;">T</span>
        <input class="tb-color" id="tb-color-text" type="color" value="#1a1a1a" title="텍스트 색상">
        <span style="font-size:11px;color:#9ca3af;margin-left:4px;">bg</span>
        <input class="tb-color" id="tb-color-bg" type="color" value="#ffffff" title="배경 색상">
      </div>

      <div class="toolbar-divider"></div>

      <!-- 정렬 -->
      <div class="toolbar-section">
        <span class="toolbar-label">정렬</span>
        <button class="tb-btn" id="tb-align-left"   title="왼쪽">⬛︎≡</button>
        <button class="tb-btn" id="tb-align-center" title="가운데">≡</button>
        <button class="tb-btn" id="tb-align-right"  title="오른쪽">≡⬛︎</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 애니메이션 -->
      <div class="toolbar-section">
        <span class="toolbar-label">애니</span>
        <button class="tb-btn" id="tb-anim-toggle" title="애니메이션 선택">✨ 애니메이션 ▾</button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 시스템 -->
      <div class="toolbar-section">
        <span class="toolbar-label">시스템</span>
        <button class="tb-btn" id="tb-undo"   title="실행 취소 (Ctrl+Z)">↩ 취소</button>
        <button class="tb-btn" id="tb-redo"   title="다시 실행 (Ctrl+Y)">↪ 다시</button>
        <button class="tb-btn" id="tb-export" title="HTML 저장">⬇ HTML</button>
        <button class="tb-btn" id="tb-pdf"    title="PDF 저장 (Ctrl+P)">📄 PDF</button>
      </div>

      <!-- 닫기 -->
      <button class="tb-btn" id="tb-close" title="편집 모드 종료 (E)">✕</button>
    `;

    document.body.appendChild(tb);
    attachToolbarEvents();
  }

  function attachToolbarEvents() {
    // 서식
    document.getElementById('tb-bold')  ?.addEventListener('click', () => execCmd('bold'));
    document.getElementById('tb-italic')?.addEventListener('click', () => execCmd('italic'));
    document.getElementById('tb-under') ?.addEventListener('click', () => execCmd('underline'));
    document.getElementById('tb-strike')?.addEventListener('click', () => execCmd('strikeThrough'));

    // 폰트 크기
    document.getElementById('tb-font-dec')?.addEventListener('click', () => changeFontSize(-2));
    document.getElementById('tb-font-inc')?.addEventListener('click', () => changeFontSize(+2));
    document.getElementById('tb-font-size')?.addEventListener('change', (e) => {
      setFontSize(parseInt(e.target.value, 10));
    });

    // 색상
    document.getElementById('tb-color-text')?.addEventListener('input', (e) => {
      execCmd('foreColor', e.target.value);
    });
    document.getElementById('tb-color-bg')?.addEventListener('input', (e) => {
      if (currentTarget) currentTarget.style.backgroundColor = e.target.value;
    });

    // 정렬
    document.getElementById('tb-align-left')  ?.addEventListener('click', () => execCmd('justifyLeft'));
    document.getElementById('tb-align-center')?.addEventListener('click', () => execCmd('justifyCenter'));
    document.getElementById('tb-align-right') ?.addEventListener('click', () => execCmd('justifyRight'));

    // 시스템
    document.getElementById('tb-undo')       ?.addEventListener('click', undo);
    document.getElementById('tb-redo')       ?.addEventListener('click', redo);
    document.getElementById('tb-export')     ?.addEventListener('click', exportHTML);
    document.getElementById('tb-pdf')        ?.addEventListener('click', exportPDF);
    document.getElementById('tb-close')      ?.addEventListener('click', toggleEditor);
    document.getElementById('tb-anim-toggle')?.addEventListener('click', toggleAnimPanel);
  }

  function execCmd(cmd, value) {
    document.execCommand(cmd, false, value || null);
    saveSnapshot();
  }

  function changeFontSize(delta) {
    if (!currentTarget) return;
    const current = parseInt(window.getComputedStyle(currentTarget).fontSize, 10) || 20;
    currentTarget.style.fontSize = (current + delta) + 'px';
    document.getElementById('tb-font-size').value = current + delta;
    saveSnapshot();
  }

  function setFontSize(px) {
    if (!currentTarget || isNaN(px)) return;
    currentTarget.style.fontSize = px + 'px';
    saveSnapshot();
  }

  function updateToolbarState() {
    if (!currentTarget) return;
    const styles = window.getComputedStyle(currentTarget);
    const sizeEl = document.getElementById('tb-font-size');
    if (sizeEl) sizeEl.value = parseInt(styles.fontSize, 10);
  }

  function clearToolbarState() {
    const sizeEl = document.getElementById('tb-font-size');
    if (sizeEl) sizeEl.value = '';
  }

  // ── 애니메이션 패널 ──────────────────────────────────
  const ANIMS = [
    { key: 'fade-in',    icon: '✨', label: 'Fade In' },
    { key: 'slide-left', icon: '→', label: 'Slide Left' },
    { key: 'slide-up',   icon: '↑', label: 'Slide Up' },
    { key: 'zoom-up',    icon: '⊕', label: 'Zoom Up' },
    { key: 'bounce',     icon: '⚡', label: 'Bounce' },
    { key: 'flip',       icon: '🔄', label: 'Flip' },
    { key: 'blur-in',    icon: '◎', label: 'Blur In' },
  ];

  function buildAnimPanel() {
    const panel = document.createElement('div');
    panel.id = 'anim-panel';
    panel.innerHTML = '<div class="anim-title">애니메이션 선택</div>';

    ANIMS.forEach(({ key, icon, label }) => {
      const btn = document.createElement('button');
      btn.className = 'anim-btn';
      btn.innerHTML = `<span class="anim-icon">${icon}</span>${label}`;
      btn.addEventListener('click', () => { applyAnim(key); closeAnimPanel(); });
      panel.appendChild(btn);
    });

    // 제거 버튼
    const removeBtn = document.createElement('button');
    removeBtn.className = 'anim-btn';
    removeBtn.innerHTML = `<span class="anim-icon">✕</span>제거`;
    removeBtn.style.color = '#ef4444';
    removeBtn.addEventListener('click', () => { removeAnim(); closeAnimPanel(); });
    panel.appendChild(removeBtn);

    document.body.appendChild(panel);

    // 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#anim-panel') && !e.target.closest('#tb-anim-toggle')) {
        closeAnimPanel();
      }
    });
  }

  function toggleAnimPanel() {
    const panel = document.getElementById('anim-panel');
    if (!panel) return;
    const btn = document.getElementById('tb-anim-toggle');
    if (panel.classList.contains('open')) {
      closeAnimPanel();
    } else {
      // 버튼 위치에 맞춰 드롭다운 위치 지정
      const rect = btn.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.classList.add('open');
      btn.classList.add('active');
    }
  }

  function closeAnimPanel() {
    const panel = document.getElementById('anim-panel');
    const btn = document.getElementById('tb-anim-toggle');
    panel?.classList.remove('open');
    btn?.classList.remove('active');
  }

  function applyAnim(key) {
    if (!currentTarget) { showToast('텍스트를 먼저 클릭하세요'); return; }
    currentTarget.setAttribute('data-anim', key);
    // 애니메이션 재실행을 위해 잠깐 제거 후 재적용
    currentTarget.style.animation = 'none';
    requestAnimationFrame(() => {
      currentTarget.style.animation = '';
    });
    showToast(`${key} 적용됨`);
    saveSnapshot();
  }

  function removeAnim() {
    if (!currentTarget) return;
    currentTarget.removeAttribute('data-anim');
    currentTarget.style.animation = '';
    showToast('애니메이션 제거됨');
    saveSnapshot();
  }

  // ── HTML 내보내기 ─────────────────────────────────────
  function exportHTML() {
    const slide = document.querySelector('.slide');
    if (!slide) return;

    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slide-exported-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML 내보내기 완료');
  }

  // ── PDF 내보내기 ──────────────────────────────────────
  function exportPDF() {
    // 편집 모드 잠깐 끄고 인쇄 (UI 요소 숨김)
    const wasActive = isEditorActive;
    if (wasActive) {
      document.body.classList.remove('editor-active');
    }
    showToast('인쇄 대화상자에서 PDF로 저장 선택 → 가로 방향 권장');
    setTimeout(() => {
      window.print();
      if (wasActive) {
        document.body.classList.add('editor-active');
      }
    }, 400);
  }

  // ── 토스트 알림 ──────────────────────────────────────
  function buildToast() {
    const toast = document.createElement('div');
    toast.id = 'editor-toast';
    document.body.appendChild(toast);
  }

  function showToast(msg) {
    const toast = document.getElementById('editor-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // ── 키보드 단축키 ─────────────────────────────────────
  function attachKeyboard() {
    document.addEventListener('keydown', (e) => {
      // E 키 — 편집 모드 토글 (텍스트 편집 중이 아닐 때만)
      if (e.key === 'e' || e.key === 'E') {
        if (!e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
          if (!isEditorActive || document.activeElement.contentEditable !== 'true') {
            e.preventDefault();
            toggleEditor();
            return;
          }
        }
      }

      if (!isEditorActive) return;

      // Ctrl+Z — 실행 취소
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y / Ctrl+Shift+Z — 다시 실행
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Ctrl+P — PDF 내보내기
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        exportPDF();
      }
    });
  }
})();
