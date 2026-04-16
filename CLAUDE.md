# ppt-maker — Claude 작업 가이드

## 프로젝트 구조 요약

슬라이드 1장 = HTML 파일 1개. `core/` 안의 CSS/JS는 건드리지 않고, 프로젝트 폴더 안에 슬라이드 HTML만 추가한다.

```
[project-name]/
├── slides.json          # 슬라이드 순서
├── slide-01-title.html
└── slide-02-content.html
```

빌드: `node core/build.js --project [project-name]`

---

## 슬라이드 디자인 원칙 (Reveal.js / Slidev / Marp 레퍼런스 기반)

PPT 요청 시 아래 원칙을 반드시 적용한다.

### 1. 한 슬라이드, 한 메시지 (Marp 철학)
- 슬라이드 한 장에 전달할 핵심이 하나여야 한다.
- 텍스트는 줄이고, 여백을 두려워하지 말 것.
- 불릿이 5개 이상이면 슬라이드를 쪼개는 걸 제안한다.

### 2. 타이포그래피로 위계 만들기 (Reveal.js 철학)
- **제목**: `--font-size-h2` 이상, `font-weight-bold` 이상
- **본문**: `--font-size-body` (20px), `line-height-normal` (1.6)
- **보조 텍스트**: `--color-text-muted` 또는 `--color-text-light`
- 강조는 색상(`--color-accent`)으로, 밑줄·대문자 남발 금지
- 자간: 제목은 `letter-spacing-tight`, 본문은 `letter-spacing-normal`

### 3. 그리드 레이아웃 우선 (Slidev 철학)
- 정보가 2개 이상 나열될 땐 `layout-two-col` 또는 CSS Grid 활용
- 카드(`card` 클래스)로 묶어서 시각적 그룹핑
- 비율: 텍스트+이미지면 `ratio-6-4`, 텍스트+수치면 `ratio-4-6`

### 4. 색상은 절제하되 포인트는 명확하게
- 슬라이드 전체에서 `--color-accent`(기본 파란색) 외 추가 색상은 최소화
- 섹션 구분 슬라이드(`layout-section`)는 accent 배경으로 강하게 대비
- 데이터·수치는 accent 색으로 시각 강조

### 5. 여백과 정렬
- 슬라이드 패딩 기본값 `64px 80px` 유지 — 줄이지 말 것
- 관련 요소끼리 `gap: --space-sm` (16px), 섹션 간 `gap: --space-lg` (40px)
- 텍스트 좌정렬 기본, 인용/섹션 슬라이드만 중앙정렬

---

## 레이아웃 선택 기준

| 상황 | 레이아웃 |
|------|----------|
| 발표 첫 슬라이드 | `layout-title` |
| 챕터 구분 | `layout-section` |
| 텍스트 중심 내용 | `layout-content` |
| 좌우 비교 / 텍스트+이미지 | `layout-two-col` |
| 임팩트 있는 한 마디 | `layout-quote` |
| 비주얼 임팩트 | `layout-image` |
| 마지막 슬라이드 | `layout-closing` |

---

## 자주 쓰는 컴포넌트 패턴

```html
<!-- 수치 강조 카드 3개 나열 -->
<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:var(--space-md);">
  <div class="card" style="text-align:center;">
    <div style="font-size:var(--font-size-display); font-weight:var(--font-weight-black); color:var(--color-accent);">84%</div>
    <div style="font-size:var(--font-size-small); color:var(--color-text-muted);">설명 텍스트</div>
  </div>
  <!-- 반복 -->
</div>

<!-- 타임라인 (좌→우 흐름) -->
<div style="display:flex; gap:var(--space-md); align-items:flex-start;">
  <div style="text-align:center; flex:1;">
    <div class="badge lg">1</div>
    <div style="margin-top:var(--space-sm); font-weight:var(--font-weight-semibold);">단계명</div>
    <div style="font-size:var(--font-size-small); color:var(--color-text-muted);">설명</div>
  </div>
</div>

<!-- 아이콘 없이 callout으로 인사이트 강조 -->
<div class="callout">핵심 인사이트 한 줄</div>
```

---

## 애니메이션 사용 원칙
- 제목: `data-anim="slide-up" data-delay="1"`
- 부제목/본문: `data-anim="fade-in" data-delay="2"`
- 카드 여러 개: 각각 `data-delay="2"`, `"3"`, `"4"` 순차 등장
- 모든 요소에 애니메이션 넣지 말 것 — 주요 요소 3~4개까지만

---

## 새 프로젝트 시작 체크리스트
1. 폴더 생성 + `slides.json` 작성
2. 슬라이드 구성: title → section → content × N → closing
3. 섹션 슬라이드로 챕터 나누기 (3~5분 단위)
4. 각 content 슬라이드: 제목 + title-bar + 본문 구조 유지
5. 빌드 후 `dist/presentation.html` 확인

---

## 슬라이드 HTML 컨벤션 (Figma 변환 호환을 위해 반드시 준수)

모든 슬라이드는 아래 구조를 따른다. 이를 지켜야 `to-figma-json.js` 파서가 올바르게 추출하고 Figma 플러그인이 정확하게 렌더링한다.

```html
<!-- 슬라이드 element: layout-* + theme-* 반드시 명시 -->
<div class="slide layout-content theme-dark">

  <!-- 표준 element 클래스 사용 -->
  <p class="slide-eyebrow">섹션명</p>        <!-- 상단 소제목 -->
  <h1 class="slide-title">슬라이드 제목</h1>
  <div class="slide-title-bar"></div>

  <div class="slide-body-content">
    <!-- 카드: class="card" 유지 -->
    <!-- 리스트: class="slide-list" + <li> -->
    <!-- 콜아웃: class="callout" -->
    <!-- 이미지 자리: class="img-placeholder" -->
  </div>
</div>
```

**절대 하지 말 것**: 슬라이드 element에 layout-*, theme-* 없이 커스텀 CSS만 사용하는 것.
**이유**: Figma 변환 시 레이아웃 타입을 인식할 수 없어 플레이스홀더만 생성됨.

---

## Figma 변환 워크플로우

사용자가 "피그마로 변환해줘" 또는 유사한 요청을 하면 아래 순서로 작업한다.

### 1단계: 슬라이드 데이터 추출

`core/to-figma-json.js`의 파싱 로직을 참고해 대상 프로젝트의 모든 슬라이드를 읽고
아래 형태의 JSON 오브젝트를 직접 구성한다 (스크립트 실행 없이 코드로 처리):

```json
{
  "project": "프로젝트명",
  "slides": [
    {
      "index": 0,
      "file": "slide-01-title.html",
      "layout": "layout-title",
      "theme": "theme-dark",
      "elements": {
        "eyebrow": "섹션명",
        "title": "슬라이드 제목",
        "subtitle": "부제목",
        "authorName": "이름",
        "authorRole": "직함"
      }
    }
  ]
}
```

### 2단계: figma-plugin/code.js 업데이트

`figma-plugin/code.js` 상단의 SLIDE_DATA 영역을 찾아 데이터를 주입한다.
반드시 마커 주석 사이의 한 줄만 교체한다:

```javascript
// [SLIDE_DATA_START]
const SLIDE_DATA = { "project": "...", "slides": [...] };
// [SLIDE_DATA_END]
```

### 3단계: 사용자에게 안내

code.js 업데이트 후 아래 내용을 안내한다:

> Figma 앱을 열고, 플러그인 메뉴에서 **ppt-maker → Figma**를 실행하세요.
> 프로젝트 정보가 표시되면 **Generate** 버튼을 클릭하면 슬라이드가 자동 생성됩니다.
> (플러그인이 없다면: Figma → 메뉴 → Plugins → Development → Import plugin from manifest
> → `figma-plugin/manifest.json` 선택)

**주의**: SLIDE_DATA에 들어가는 텍스트는 HTML 태그 없이 순수 텍스트만. 특수문자는 JS 문자열 이스케이프 적용.
