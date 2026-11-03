# Subgraph 묶음 예제

회사 데이터 없이 subgraph 묶음 박스·서비스 아이콘·선 종류(실선·점선·굵은 선)를 함께 확인하는 예제다.
`DIAGRAM_SOURCE=examples/groups.md node server.js`로 연다.

## 전체 구조

```mermaid
flowchart LR
  U[사용자 브라우저] -- HTTPS --> W
  subgraph EDGE[웹 계층]
    W[web-app.js] -- RPC --> A[api-server.js]
  end
  subgraph DATA[데이터 계층]
    DB[(Postgres database)]
    Q[job-queue.js]
  end
  subgraph OPS[GitHub · Slack 운영]
    GH[GitHub Actions]
    SL[Slack 알림]
  end
  A -- SQL --> DB
  A --> Q
  GH -. deploy .-> W
  Q -. 실패 알림 .-> SL
```

## src/web/web-app.js | 웹 앱

```mermaid
flowchart TD
  A[요청 수신] --> B{로그인 상태인가?}
  subgraph AUTH[인증]
    B -- 아니오 --> C[로그인 화면]
    C --> D[세션 발급]
  end
  subgraph PAGE[화면 처리]
    E[페이지 렌더링] --> F[응답 반환]
  end
  B -- 예 --> E
  D --> E
```

## src/api/api-server.js | API 서버

```mermaid
flowchart TD
  A[API 요청] ==> B{입력이 유효한가?}
  B -- 아니오 --> C[400 응답]
  subgraph SAVE[저장]
    B -- 예 --> D[(Postgres database)]
    D --> E[작업 큐 등록]
  end
  E -. 비동기 .-> F[job-queue.js]
```

## src/jobs/job-queue.js | 작업 큐

```mermaid
flowchart TD
  A[작업 수신] --> B{재시도 횟수 초과?}
  B -- 예 --> C[Slack 알림]
  B -- 아니오 --> D[작업 실행]
  D --> E[완료 기록]
```
