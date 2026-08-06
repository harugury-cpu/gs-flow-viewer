# GS Flow Viewer

Google Apps Script(GAS) 자동화 프로젝트의 파일별 흐름을 Mermaid 다이어그램으로 탐색하는 로컬 웹 뷰어입니다. `.gs` 파일만 있으면 됩니다 — Mermaid 마크다운이 없어도 [Codex](https://developers.openai.com/codex) 프롬프트로 그 자리에서 생성할 수 있습니다.

## 빠른 시작 (Codex 사용자)

1. 이 레포를 GAS 프로젝트 옆(또는 안)에 클론합니다.
2. `.gs` 파일들이 있는 디렉토리에서 Codex를 실행하고 `.codex/prompts/generate-diagrams.md` 프롬프트를 사용해 `diagrams.md`를 생성합니다.
   ```bash
   codex exec "$(cat gs-flow-viewer/.codex/prompts/generate-diagrams.md)"
   ```
   (Codex CLI에 프로젝트 프롬프트로 등록해 `/generate-diagrams`처럼 짧게 불러도 됩니다.)
3. 뷰어를 실행합니다.
   ```bash
   cd gs-flow-viewer
   node server.js
   ```
4. 브라우저에서 [http://localhost:4747](http://localhost:4747) 을 엽니다.

Node.js 내장 모듈만 사용하므로 `npm install` 없이 바로 실행됩니다.

## 무엇을 보여주나

- 좌측 사이드바에서 `전체 구조` 또는 파일별 상세 흐름을 선택합니다.
- 전체 구조에서 파일명 노드를 클릭하면 해당 파일 상세로 드릴다운됩니다.
- 상세 화면에서는 `← 전체 구조로` 버튼으로 돌아갑니다.
- 실시간 실행 로그·성공/실패 상태는 표시하지 않습니다(문서 뷰어입니다).

## 데이터 소스 (`diagrams.md`)

`server.js`는 뷰어 루트의 `diagrams.md`를 읽어 `## 제목` + ` ```mermaid ` 코드블록을 파싱합니다. 요청마다 새로 읽으므로(서버 캐싱 없음), `diagrams.md`를 고치고 새로고침하면 바로 반영됩니다.

다른 경로의 마크다운을 쓰려면 환경 변수로 지정합니다.

```bash
DIAGRAM_SOURCE=/path/to/your-diagrams.md node server.js
```

포맷 규칙과 자동 생성 방법은 `.codex/prompts/generate-diagrams.md`를 참고하세요. 직접 쓸 경우 핵심만:

- 첫 섹션은 `## 전체 구조` (뷰어가 개요로 인식)
- 이후 섹션은 파일당 하나, `## <경로>/<파일명>`
- 전체 구조 노드 라벨이 상세 섹션 파일명과 정확히 일치해야 클릭 드릴다운이 동작

## 보드/서비스 색상 필터 (선택)

`public/boards.config.js`를 채우면 사이드바에 보드/서비스별 필터 칩과 다이어그램 색 구분이 활성화됩니다. 비워두면(기본값) 관련 UI가 자동으로 숨겨지고 순수 Mermaid 뷰어로 동작합니다. 형식은 파일 안 주석을 참고하세요.

## 파일 구성

- `server.js`: 정적 파일 서버와 Markdown 파서
- `public/index.html`: 화면 골격과 Mermaid 로드(`public/vendor/mermaid.min.js`, 로컬 번들)
- `public/app.js`: 데이터 로드, 사이드바, Mermaid 렌더링, 드릴다운
- `public/boards.config.js`: 보드/서비스 색상 필터 설정(선택)
- `public/style.css`: 반응형 사이드바·메인 레이아웃
- `.codex/prompts/generate-diagrams.md`: `.gs` 파일 → `diagrams.md` 생성 프롬프트
- `DESIGN.md`: 이 도구의 UI 토큰과 컴포넌트 계약
