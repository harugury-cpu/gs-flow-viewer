# Monday GAS Flow Viewer Design System

## 0. Research Log (greenfield only)

- Embedded refs: `notion.md`와 `linear.app.md`를 후보로 검토하고, 운영 도구의 읽기 중심 탐색에는 `notion.md`의 따뜻한 중립 표면과 문서형 계층을 적용했습니다.
- Lazyweb: 생략했습니다. localhost 전용 내부 도구이며 외부 제품 화면 복제가 목적이 아닙니다.
- Imagen drafts: 생략했습니다. 다이어그램 자체가 핵심 콘텐츠이고 bitmap visual이 필요하지 않습니다.

## 1. Atmosphere & Identity

코드와 흐름을 조용히 펼쳐 보는 정비용 작업대입니다. Apple의 near-black 레일과 parchment 캔버스, 한 가지 Action Blue를 사용해 도구 자체가 Mermaid 흐름보다 앞에 나서지 않도록 합니다.

시그니처는 두 층입니다.
1. 셸 액센트는 Action Blue(`#0066cc`) 하나로 절제
2. **보드 정체성**은 full-palette 칩/노드 색으로 구분 (사이드바는 보드 필터 단일 진입)
3. 웹훅 상세 차트는 `먼데이 변경 알림` 상자 옆에 `- 보드명`을 표시

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
| Surface/primary | `--surface-canvas` | `#f5f5f7` | Main canvas |
| Surface/secondary | `--surface-raised` | `#ffffff` | Diagram panel |
| Surface/sidebar | `--surface-sidebar` | `#1d1d1f` | Navigation rail |
| Surface/sidebar-raised | `--surface-sidebar-3` | `#333336` | Active navigation |
| Surface/on-sidebar | `--surface-on-sidebar` | `#ffffff` | Active sidebar text |
| Surface/accent-soft | `--surface-accent-soft` | `#f0faf8` | Accent control hover |
| Surface/diagram | `--surface-diagram` | `#fcfdfe` | Diagram viewport |
| Surface/error | `--surface-error` | `#fff7f6` | Error message background |
| Text/primary | `--text-primary` | `#172331` | Titles and body |
| Text/secondary | `--text-secondary` | `#526273` | Supporting copy |
| Text/sidebar | `--text-sidebar` | `#dbe6ee` | Navigation labels |
| Text/sidebar-muted | `--text-sidebar-muted` | `#91a5b8` | Navigation metadata |
| Text/sidebar-active-muted | `--text-sidebar-active-muted` | `#a4d7d1` | Active navigation metadata |
| Text/sidebar-error | `--text-sidebar-error` | `#ffb4ab` | Sidebar error state |
| Border/default | `--border-default` | `#dce4eb` | Panel and row boundaries |
| Border/subtle | `--border-subtle` | `#e9eef3` | Soft separations |
| Border/sidebar-subtle | `--border-sidebar-subtle` | `rgba(219, 230, 238, 0.12)` | Sidebar divider |
| Border/sidebar-hover | `--border-sidebar-hover` | `rgba(219, 230, 238, 0.14)` | Sidebar hover |
| Border/sidebar-active | `--border-sidebar-active` | `rgba(24, 169, 153, 0.5)` | Sidebar active row |
| Border/sidebar-overview | `--border-sidebar-overview` | `rgba(24, 169, 153, 0.32)` | Overview row boundary |
| Border/error | `--border-error` | `#f1c5c0` | Error message boundary |
| Accent/primary | `--accent` | `#0066cc` | Active state and links |
| Accent/hover | `--accent-strong` | `#0071e3` | Focus and hover state |
| Status/error | `--status-error` | `#b42318` | Load and render errors |

### Rules

- Accent is reserved for interactive or selected states, never decoration.
- Surface hierarchy uses tonal shifts and restrained borders. No gradients or glow.
- The page stays light and readable; the sidebar is the only dark region.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Usage |
|------|------|------|------|------|
| H1 | `40px` | 600 | 1.10 | Page and diagram title |
| H2 | `17px` | 600 | 1.24 | Panel heading |
| Body | `17px` | 400 | 1.47 | Default text |
| Body/sm | `14px` | 400 | 1.5 | Metadata and nav |
| Caption | `12px` | 600 | 1.4 | Section labels |

### Font Stack

- Display: `"SF Pro Display", "SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
- Primary: `"SF Pro Text", system-ui, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`
- Mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Rules

- Body text stays at or above `14px`.
- Korean filenames may wrap naturally; long unbroken names use `overflow-wrap: anywhere`.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a `4px` base.

| Token | Value | Usage |
|------|------|------|
| `--space-1` | `4px` | Icon and label separation |
| `--space-2` | `8px` | Compact list spacing |
| `--space-3` | `12px` | Nav and metadata padding |
| `--space-4` | `16px` | Standard panel padding |
| `--space-5` | `20px` | Comfortable control padding |
| `--space-6` | `24px` | Main canvas gap |
| `--space-8` | `32px` | Major panel rhythm |

### Grid

- Desktop shell: `300px` sidebar plus fluid main column.
- Main content max measure: `1440px`.
- Breakpoint: `780px` switches the sidebar above the main content.
- Scroll owner: the sidebar owns its list scroll on desktop; the main region owns document scroll; the diagram viewport owns diagram overflow.

## 5. Components

### Navigation rail

- **Structure**: `aside > header + nav > button`.
- **Variants**: overview, detail, active.
- **Spacing**: `--space-2` rows, `--space-4` rail padding.
- **States**: default, hover, active, focus, disabled by absence only.
- **Accessibility**: native buttons, visible focus ring, `aria-current` for active item.
- **Motion**: short background-color transition only.
- **Layout**: `fixed-sidenav-shell`; sidebar list is the scroll owner.

### Diagram canvas

- **Structure**: `main > header + section > div.diagram-viewport`.
- **Variants**: overview and detail.
- **Spacing**: `--space-6` outer gap, `--space-4` panel padding.
- **States**: loading, rendered, error, empty.
- **Accessibility**: heading hierarchy, status region for errors, rendered drill-down nodes are keyboard-focusable buttons.
- **Motion**: none; diagram rendering should settle immediately.
- **Layout**: `content-limiter` around metadata and a dedicated horizontal overflow viewport for wide Mermaid output.

### Return control

- **Structure**: native `button` in the main toolbar.
- **Variants**: visible on detail only, hidden on overview.
- **Spacing**: `--space-2` inline gap and `--space-3` control padding.
- **States**: default, hover, active, focus.
- **Accessibility**: descriptive label and keyboard reachability.
- **Motion**: short transform-free color transition.
- **Layout**: `cluster` in the toolbar.

## 6. Motion & Interaction

### Timing

- Micro: `120ms ease-out` for nav and button state changes.

### Rules

- Only color and opacity transitions are used.
- `prefers-reduced-motion: reduce` disables transitions.
- Mermaid node clicks are optional drill-down; sidebar buttons remain the primary navigation.

## 7. Depth & Surface

### Strategy

`mixed`: subtle borders define the application shell, while a low-contrast shadow lifts the diagram canvas from the main background.

- Panel shadow: `0 12px 28px rgba(23, 35, 49, 0.06)`.
- Control radius: `10px`.
- Diagram panel radius: `16px`.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target, with visible focus on every interactive element.
- Full keyboard access for sidebar and return control.
- Korean text must wrap without clipping.
- Reduced motion is respected.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|------|------|------|
| Mermaid CDN availability is external | `public/index.html` | Required by the user and localhost tool has no npm install step | Replace only if the user later requests an offline bundle |
