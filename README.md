# ppt-maker

Claude Code로 구동하는 HTML 기반 프레젠테이션 제작 시스템.
PDF나 문서를 업로드하면 Claude Code가 내용을 파악해 슬라이드를 자동 생성하고, 최종 결과물을 Figma로 내보낼 수 있습니다.

---

## 전체 프로세스

### 0. 준비 (최초 1회)

```bash
git clone https://github.com/[your-org]/ppt-maker.git
```

Claude Code로 폴더 열기. 설치할 것 없음.

---

### 1. 발표 자료 만들기

Claude Code에 파일을 업로드하고 요청합니다.

```
"첨부한 사업계획서 PDF 보고 투자자용 IR 덱 만들어줘.
 theme-dark 테마로, 슬라이드 10장 내외로."
```

PDF, 워드, 메모 텍스트 뭐든 가능. Claude Code가 내용을 파악해 자동으로:
- 프로젝트 폴더 + `slides.json` 생성
- 슬라이드 HTML 파일 생성
- 로컬 서버 실행 (`python3 -m http.server 3000`)

브라우저에서 확인: `http://localhost:3000/[프로젝트명]/slide-01-title.html`

---

### 2. 디자인 테마

슬라이드 요청 시 원하는 테마를 함께 말하면 됩니다.

| 테마 | 느낌 | 어울리는 상황 |
|---|---|---|
| 기본 (없음) | 클린 화이트 | 일반 사내 발표 |
| `theme-dark` | 테크 다크 | IR, 기술 발표 |
| `theme-tech` | 딥 네이비 | SaaS, 개발자 대상 |
| `theme-minimal` | 에디토리얼 | 브랜드, 전략 문서 |
| `theme-warm` | 크림/앰버 | 팀 공유, 소비자향 |

커스텀도 가능합니다.

```
"강조 색상 남색으로, 배경 약간 따뜻하게 해줘"
```

---

### 3. 피드백 → 수정 반복

브라우저에서 보면서 Claude Code에 피드백합니다.

```
"3번 슬라이드 수치 강조 더 크게"
"7번 슬라이드 두 컬럼으로 바꿔줘"
"전체적으로 텍스트 줄이고 여백 늘려줘"
```

브라우저 인라인 편집기(`E` 키)로 직접 텍스트 수정도 가능합니다.

---

### 4. 완성본 출력

**웹 발표용** — 브라우저에서 바로 발표, 키보드 `←` `→` 로 슬라이드 이동

**단일 파일 빌드** — 공유용 HTML 한 파일로 합치기

```bash
node core/build.js --project [프로젝트명]
# → [프로젝트명]/dist/presentation.html
```

**PDF 저장** — 브라우저에서 `Ctrl+P` → PDF로 저장

---

### 5. Figma 전환 (이미지·일러스트 삽입이 필요할 때)

Claude Code에 요청합니다.

```
"[프로젝트명] 피그마로 변환해줘"
```

Claude Code가 슬라이드 내용을 읽고 `figma-plugin/code.js`를 자동 업데이트합니다.

이후:
1. **Figma 앱** 열기
2. **Plugins → ppt-maker → Figma** 실행
3. 프로젝트명·슬라이드 수 확인 후 **Generate** 클릭
4. 1280×720 프레임으로 슬라이드 자동 생성

Figma에서 이미지 플레이스홀더에 사진·일러스트를 삽입하고 PDF 또는 공유 링크로 내보내면 완성.

> 플러그인 최초 등록: Figma → Plugins → Development → Import plugin from manifest
> → `figma-plugin/manifest.json` 선택

---

## 전체 흐름

```
PDF / 문서 업로드
        ↓
Claude Code → 슬라이드 자동 생성 (테마 적용)
        ↓
브라우저에서 확인 + 피드백 반복
        ↓
        ├─ 웹 발표 / PDF 저장   ← 여기서 끝내도 됨
        └─ Figma 변환 요청
                ↓
            Figma에서 이미지 삽입 + 최종 마무리
```

터미널을 만질 일 없습니다. Claude Code에 말로 요청하고, 브라우저와 Figma만 열면 됩니다.

---

## 레퍼런스

### 레이아웃 클래스

| 클래스 | 용도 |
|---|---|
| `layout-title` | 발표 첫 슬라이드 |
| `layout-section` | 챕터 구분 |
| `layout-content` | 제목 + 본문 / 카드 그리드 |
| `layout-two-col` | 좌우 2단 분할 |
| `layout-quote` | 인용구 임팩트 |
| `layout-image` | 전체 이미지 + 캡션 |
| `layout-closing` | 마지막 슬라이드 |

### 브라우저 인라인 편집기

| 단축키 | 기능 |
|---|---|
| `E` | 편집 모드 토글 |
| `Ctrl+Z` | 실행취소 |
| `Ctrl+Y` | 다시실행 |
| `Ctrl+P` | PDF 저장 |

### 프로젝트 구조

```
ppt-maker/
├── core/
│   ├── theme.css              # 디자인 시스템 (CSS 변수 + 테마 5종)
│   ├── slide-base.css         # 레이아웃 클래스 + 뷰포트
│   ├── editor.css / editor.js # 브라우저 인라인 편집기
│   ├── nav.js                 # 키보드 네비게이션
│   ├── build.js               # 단일 HTML 빌드
│   └── to-figma-json.js       # Figma 변환용 데이터 추출
│
├── figma-plugin/              # Figma 플러그인
│   ├── manifest.json
│   ├── code.js                # Claude Code가 자동 업데이트
│   └── ui.html
│
├── demo/                      # 레이아웃·컴포넌트 쇼케이스
│
└── [project-name]/
    ├── slides.json
    ├── slide-01-title.html
    └── dist/
        └── presentation.html
```
