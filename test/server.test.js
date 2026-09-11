const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createServer,
  extractFileName,
  parseDiagrams,
} = require('../server');

test('여러 언어의 경로와 표시명을 파싱한다', () => {
  const markdown = [
    '## 전체 구조',
    '',
    '```mermaid',
    'flowchart TD',
    '  A[create-order.ts] --> B[worker.py]',
    '```',
    '',
    '## src/orders/create-order.ts | 주문 생성',
    '',
    '```mermaid',
    'flowchart TD',
    '  A[요청] --> B[저장]',
    '```',
    '',
    '## jobs/worker.py | 백그라운드 작업',
    '',
    '```mermaid',
    'flowchart TD',
    '  A[작업 수신] --> B[처리]',
    '```',
  ].join('\n');

  const diagrams = parseDiagrams(markdown);

  assert.equal(diagrams.length, 3);
  assert.equal(diagrams[0].id, 'overview');
  assert.equal(diagrams[1].fileName, 'create-order.ts');
  assert.equal(diagrams[1].displayName, '주문 생성');
  assert.equal(diagrams[2].fileName, 'worker.py');
});

test('확장자와 무관하게 마지막 경로 조각을 파일명으로 사용한다', () => {
  assert.equal(extractFileName('services/payment/main.go'), 'main.go');
  assert.equal(extractFileName('workflows/deploy.yaml'), 'deploy.yaml');
});

test('설정 엔드포인트가 실행 가능한 JavaScript 설정을 반환한다', async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/viewer.config.js`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/javascript/);
  assert.match(body, /window\.FLOW_VIEWER_CONFIG/);
});
