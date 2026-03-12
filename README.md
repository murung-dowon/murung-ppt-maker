# ppt-maker

HTML 파일 기반의 모듈형 프레젠테이션 시스템.
슬라이드 1장 = HTML 파일 1개. 디자인은 CSS 변수 하나로 전체 통제.

## 구조

```
ppt-maker/
├── core/                      # 핵심 엔진 (공통, 건드리지 않음)
│   ├── theme.css              # CSS 변수 기반 디자인 시스템 (색상·폰트·간격)
│   ├── slide-base.css         # 슬라이드 뷰포트·스케일링·레이아웃 클래스
│   ├── editor.css             # 브라우저 인라인 편집기 UI 스타일
│   ├── nav.js                 # 키보드/버튼 슬라이드 네비게이션
│   ├── editor.js              # 브라우저 인라인 편집기 (텍스트·애니메이션·export)
│   ├── build.js               # 단일 HTML 빌드 스크립트 (Node.js)
│   └── slide-template.html    # 새 슬라이드 기본 템플릿
│
├── package.json
│
└── [project-name]/            # 발표 프로젝트 (필요할 때마다 추가)
    ├── slides.json            # 슬라이드 순서 목록
    ├── slide-01-title.html
    ├── slide-02-content.html
    └── dist/
        └── presentation.html  # 빌드 결과물 (단일 파일)
```

## 빠른 시작

### 개발 서버 실행

```bash
# Python (별도 설치 불필요)
python3 -m http.server 3000
```

브라우저에서 `http://localhost:3000/[project-name]/slide-01-title.html` 접속.

> `file://` 직접 열기는 `slides.json` fetch 오류 발생 → 반드시 서버로 실행

### 새 프로젝트 만들기

1. 프로젝트 폴더 생성
2. `slides.json` 작성 (슬라이드 파일 목록)
3. `core/slide-template.html` 복사해서 슬라이드 작성

```json
[
  { "file": "slide-01-title.html",   "title": "타이틀" },
  { "file": "slide-02-content.html", "title": "내용" }
]
```

### 빌드 (단일 HTML 파일로 합치기)

```bash
node core/build.js --project [project-name]
# → [project-name]/dist/presentation.html 생성
```

## 슬라이드 레이아웃 클래스

`core/slide-base.css`에 정의된 레이아웃:

| 클래스 | 용도 |
|--------|------|
| `layout-title` | 대형 타이틀 슬라이드 |
| `layout-section` | 섹션 구분 (번호 + 제목) |
| `layout-content` | 제목 + 불릿 리스트 |
| `layout-two-col` | 2단 분할 |
| `layout-quote` | 인용구 |
| `layout-image` | 전체 이미지 + 캡션 |
| `layout-closing` | 마무리 슬라이드 |

## 브라우저 인라인 편집기

슬라이드를 브라우저에서 바로 편집 가능.

| 단축키 | 기능 |
|--------|------|
| `E` | 편집 모드 토글 |
| `Ctrl+Z` | 실행취소 |
| `Ctrl+Y` | 다시실행 |
| `Ctrl+P` | PDF 저장 |

편집 모드 활성화 시 상단 툴바에서:
- 텍스트 서식 (Bold / Italic / Underline / Strikethrough)
- 폰트 크기·색상 조정
- 애니메이션 프리셋 적용 (Fade In / Slide Up / Zoom Up / Bounce / Flip / Blur In)
- HTML 파일 내보내기
- PDF 저장

## 테마 커스터마이징

`core/theme.css`의 CSS 변수를 수정하면 전체 프로젝트에 즉시 반영:

```css
:root {
  --color-accent: #2563eb;   /* 포인트 색상 */
  --color-bg:     #ffffff;   /* 슬라이드 배경 */
  --color-text:   #1a1a1a;   /* 기본 텍스트 */
  --font-sans:    'Pretendard', sans-serif;
}
```

## 애니메이션

HTML 요소에 `data-anim` 속성으로 입장 애니메이션 적용:

```html
<h1 data-anim="slide-up" data-delay="1">제목</h1>
<p  data-anim="fade-in"  data-delay="2">내용</p>
```

| `data-anim` 값 | 효과 |
|----------------|------|
| `fade-in` | 페이드 인 |
| `slide-up` | 아래에서 올라오기 |
| `slide-left` | 오른쪽에서 밀려오기 |
| `zoom-up` | 작게 줌인 |
| `bounce` | 바운스 |
| `flip` | Y축 플립 |
| `blur-in` | 블러 해제 |

`data-delay` 값은 `1`~`8` (0.1s 단위 딜레이).
