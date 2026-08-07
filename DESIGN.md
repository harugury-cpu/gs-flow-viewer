# Monday GAS Flow Viewer Design System

## 0. Research Log (greenfield only)

- 2026-08-07 1차 리디자인: Apple 스타일(다크 사이드바 + Action Blue) → "제도판/스키마틱 작업대"(웜 페이퍼 + 잉크 네이비 + 오렌지 + 모눈)로 교체.
- 2026-08-07 2차 리디자인(이 문서가 서술하는 최종 상태): 사용자가 `x-business-design-system.md`(business.x.com 분석 문서)를 보고 그 라이트 버전을 요청. 니어블랙 X Business 시스템을 오프화이트로 반전한 팔레트로 전면 교체.
- Lazyweb: `x-business-design-system.md` — 사용자가 직접 지정한 참조 문서. 컬러·타이포·pill 버튼·보더 구획 원칙을 그대로 채택하고 라이트 팔레트로 반전했다.
- Imagen drafts: 생략. 다이어그램 자체가 핵심 콘텐츠이고 bitmap visual이 필요 없음.

## 1. Atmosphere & Identity

배경색을 거의 바꾸지 않고, 섹션은 카드 박스 대신 얇은 `border-top` 라인으로만 구분한다. 컬러는 최소화하고(중립 오프화이트 + 텍스트 투명도 계층 + 액센트 하나), 버튼·칩은 완전한 pill로 통일한다. 타이포는 하나의 산세리프 패밀리, 좁은 웨이트 범위(400~580), 작은 본문(13px)으로 정보 밀도를 낮춘다.

시그니처는 두 층입니다.
1. 셸 액센트는 X Blue 계열 하나(`--accent` `#1d7bd6`)로 절제
2. **보드 정체성**은 full-palette 칩/노드 색으로 구분 (사이드바는 보드 필터 단일 진입) — 셸 팔레트 교체와 무관하게 유지

## 1.1 Board identity colors (app.js `BOARDS`)

| Board | Role | Notes |
|------|------|------|
| Mobile 패키지 현황 | webhook | 도안상태 알림 |
| CP 패키지 현황 | webhook | 카드싱크·크로스체크 |
| CP Package | webhook | 제작요청·카드싱크 |
| 1파트_SKU master | webhook | 진행 구분 |
| WO / 생활용품 | webhook | 2파트 도안완료 |
| 폴더블 장탈착 보드 | webhook | BOM/영상 |
| 업무정량화 완료 보드 | webhook | 설문 배치 |
| 개발현황·보안·패키지 마스터 | linked | 웹훅 아님, 연동 보드 |

미사용 GS 그룹과 C11 패키지·지원/테스트 보드는 뷰어에서 표시하지 않습니다.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|------|------|------|
| Background/primary | `--bg-primary` | `#fbfbfc` | 페이지 전체 배경(사이드바·본문 공용) |
| Background/secondary | `--bg-secondary` | `#f1f1f3` | 카드형 표면(meta-summary, chip-list--lg, 다이어그램 뷰포트) |
| Background/tertiary | `--bg-tertiary` | `#e9e9ec` | 예약 — 추가 단계 표면 필요 시 |
| Text/primary | `--fg-primary` | `#0d0d0f` | 제목·본문 |
| Text/muted | `--fg-muted` | `rgba(13,13,15,.62)` | 보조 텍스트 |
| Text/dim | `--fg-dim` | `rgba(13,13,15,.4)` | 라벨·캡션·메타 |
| Border | `--border` | `rgba(13,13,15,.1)` | 섹션 구분선, 기본 보더 |
| Border/strong | `--border-strong` | `rgba(13,13,15,.16)` | hover·active 보더 |
| Accent | `--accent` | `#1d7bd6` | CTA, 링크, 선택 상태 |
| Accent/soft | `--accent-soft` | `rgba(29,123,214,.1)` | 배경 틴트, 웹훅 배지 |
| Status/success | `--success` | `#00875a` | 데이터 로드 상태 점 |
| Status/error | `--danger` | `#d1223b` | 로드·렌더 오류 |

### Rules

- 배경색을 거의 바꾸지 않는다 — 사이드바와 본문은 동일한 `--bg-primary`이고, 오직 `border-right` 한 줄로만 구분한다.
- 섹션 구분은 배경 대비가 아니라 `border-top` 라인으로 한다. 다이어그램 패널·관련 보드 섹션 모두 카드 박스 대신 라인 구획을 쓴다.
- 텍스트 계층은 투명도 3단(100% / 62% / 40%)으로만 표현한다.
- 보드 정체성 팔레트(각 보드 고유 색)는 셸 액센트와 별개로 full-palette 유지.
- pill(`--radius-pill`, 완전 라운드)이 버튼·칩의 기본형이다.

## 3. Typography

### Scale

| Level | Size | Weight | Usage |
|------|------|------|------|
| Diagram title | `clamp(24px, 2.6vw, 32px)` | 500 | 파일/전체 구조 제목 |
| Sidebar brand | `20px` | 580 | 사이드바 로고 타이틀 |
| Eyebrow / panel label | `13px` | 500 | 섹션 라벨, 상단 캡션 |
| Body / nav label | `13px` | 500 | 네비 항목, 칩, 버튼 |
| Caption / meta | `11–12px` | 500 | 경로, 배지, title-block |
| Meta value | `15px` | 500 | meta-summary 강조 값 |

### Font Stack

- `--font`: `"Inter", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif` — Inter는 오프라인 번들이 없어 로컬 미설치 시 시스템 산세리프로 조용히 대체된다(product register 허용 범위).
- `--mono`: `ui-monospace, "SF Mono", Menlo, Consolas, monospace` — 파일 경로·title-block 값에만 한정 사용.

### Rules

- 폰트 패밀리는 하나로 통일, 웨이트는 400/500/580만 사용.
- 본문을 13px로 작게 써서 정보 밀도를 낮춘다(product register: 데이터·조밀 UI는 촘촘해도 됨).
- letter-spacing은 제목에서만 살짝 타이트하게(`-0.01em`).

## 4. Spacing & Layout

### Base Unit

4px 기준, `--space-1`~`--space-8` 유지.

### Grid

- 데스크톱 셸: 사이드바 300px + 유동 메인 컬럼
- Breakpoint: 960px에서 사이드바가 메인 위로 이동, 720px에서 여백 축소
- 섹션 위/아래 여백은 넉넉하게(28~40px), 섹션 간 배경 변화 없이 `border-top` 하나로 끝낸다.

## 5. Components

### Navigation rail (사이드바)

- **구조**: `aside > header + nav > button`. 배경은 본문과 동일, `border-right` 1px로만 구분.
- **파일 인덱스 도트**: `nav-item__rail`을 6px 원형 도트로, 보드 색상을 그대로 표시.
- **모션**: 배경색 전환만(`200ms cubic-bezier(.23,1,.32,1)`), `prefers-reduced-motion` 존중.

### Diagram canvas

- **구조**: `main > header + section > div.diagram-viewport + div.title-block`
- **뷰포트**: `--bg-secondary` 카드 표면, `--radius-md`(12px) 라운드. 장식적 그리드·코너마크 없음 — X Business 원칙(컬러 최소화, 여백의 힘)에 따라 절제.
- **title block**: 그리드 셀 대신 얇은 `border-top` + 인라인 label:value 행. `app.js`의 `setTitleBlock()`이 `showDiagram`/`renderDiagram` 타이밍에 값을 채운다.
- **접근성**: heading hierarchy, 오류는 상태 리전, 드릴다운 노드는 키보드 포커스 가능한 버튼.

### Buttons & chips

- pill 형태 통일(`--radius-pill`). Primary는 `--fg-primary` 배경 + `--bg-primary` 텍스트(고대비), Ghost/back-button은 투명 배경 + 보더.

## 6. Motion & Interaction

- Micro: `200ms cubic-bezier(0.23, 1, 0.32, 1)` — X Business의 ease-out 커브
- `prefers-reduced-motion: reduce`에서 전환 비활성화
- Mermaid 노드 클릭은 선택적 드릴다운, 사이드바 버튼이 주 내비게이션

## 7. Depth & Surface

- 그림자 없음 — X Business 원칙(라인으로 구분, 배경색·그림자 최소화)에 따라 보더와 배경 틴트만으로 위계를 만든다.
- Control radius: `--radius-pill`(버튼/칩), `--radius-md` 12px(카드형 표면), `--radius-sm` 8px(네비 아이템 hover 배경).

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA 목표, 모든 인터랙티브 요소에 visible focus
- 사이드바·리턴 컨트롤 전체 키보드 접근 가능
- 한글 텍스트는 클리핑 없이 줄바꿈
- Reduced motion 존중
- `--fg-dim`(40% 투명도)을 본문에는 쓰지 않는다 — 라벨·캡션 전용, 오프화이트 배경에서 본문 대비 기준(4.5:1) 미달 위험.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|------|------|------|
| Mermaid CDN availability is external | `public/index.html` | 사용자 요구사항이며 localhost 도구에 npm install 단계가 없음 | 오프라인 번들 요청 시에만 교체 |
| Mermaid themeVariables는 hex만 허용 | `public/app.js` | Mermaid의 rgba/oklch 파서 제한 | Mermaid가 지원하면 CSS 토큰과 통일 |
| Inter 폰트 미번들 | `public/style.css` `--font` | 오프라인 로컬 도구, 웹폰트 CDN 로드 금지 방침 | 시스템에 Inter 설치 시 자동 적용, 없으면 시스템 산세리프로 조용히 대체 |
