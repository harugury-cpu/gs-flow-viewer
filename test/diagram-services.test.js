const assert = require('node:assert/strict');
const test = require('node:test');
const { readServices, nodeDefinitions, annotateNodes, addGroups, validateServices } = require('../public/diagram-services');

test('문구와 무관하게 명시된 대상 서비스를 읽는다', () => {
  const code = 'flowchart TD\n A[Mobile 상태 변경] --> B{상태가 완료인가?}\n class A svc_monday\n class B svc_apps_script';
  assert.deepEqual([...readServices(code)], [['A', 'monday'], ['B', 'apps-script']]);
  validateServices(code, readServices(code));
});

test('다른 문구·HTML·도형에서도 노드 ID와 원래 모양을 보존한다', () => {
  const code = 'flowchart TD\n A["Mobile<br/>상태 변경"] --> B{"완료인가?"}\n B --> C(["저장 (기록)"])\n C --> D[(업무기록)]\n D --> E((끝))';
  assert.deepEqual(nodeDefinitions(code).map(({ id, open, close }) => [id, open, close]), [
    ['A', '[', ']'], ['B', '{', '}'], ['C', '([', '])'], ['D', '[(', ')]'], ['E', '((', '))'],
  ]);
  const result = annotateNodes(code, (node) => `<span class='svc-slot'></span>${node.label}`);
  assert.match(result, /B\{"<span class='svc-slot'><\/span>완료인가\?"\}/);
  assert.match(result, /C\(\["<span class='svc-slot'><\/span>저장 \(기록\)"\]\)/);
  assert.match(result, /Mobile<br\/>상태 변경/);
  assert.equal((result.match(/-->/g) || []).length, 4);
});

test('서비스 그룹을 추가해도 원래 간선·분기·클래스는 그대로 둔다', () => {
  const code = 'flowchart TD\n A[상태 변경] --> B{완료인가?}\n B -- 예 --> C[알림 전송]\n B -- 아니오 --> D[종료]\n class A svc_monday\n class B,D svc_apps_script\n class C svc_google_chat\n class A trigger';
  const { code: grouped, groups } = addGroups(code, readServices(code));
  assert.ok(grouped.startsWith(code));
  assert.deepEqual([...groups.values()], ['monday', 'apps-script', 'google-chat']);
  assert.match(grouped, /subgraph SVC_GROUP_google_chat\["Google Chat"\]/);
  assert.equal((grouped.match(/B -- 예 --> C/g) || []).length, 1);
  assert.equal(addGroups(grouped, readServices(grouped)).code, grouped);
});

test('기존 그룹과 서비스 분류가 없는 문서는 보존한다', () => {
  const existing = 'flowchart TD\n subgraph API[업무 묶음]\n A[처리]\n end\n class A svc_apps_script';
  assert.equal(addGroups(existing, readServices(existing)).code, existing);
  const plain = 'flowchart TD\n A[요청] --> B[완료]';
  assert.equal(addGroups(plain, readServices(plain)).code, plain);
});

test('모순된 분류와 존재하지 않는 노드·서비스를 진단한다', () => {
  assert.throws(() => readServices('class A svc_monday\nclass A svc_sheets'), /두 개/);
  assert.throws(() => validateServices('A[상태]\nclass Z svc_monday', readServices('class Z svc_monday')), /노드 정의/);
  assert.throws(() => validateServices('A[상태]', readServices('class A svc_mystery')), /알 수 없는 서비스/);
});

test('생성 그룹 ID가 실제 노드 ID와 충돌하지 않는다', () => {
  const code = 'flowchart TD\n SVC_GROUP_monday[상태 변경]\n class SVC_GROUP_monday svc_monday';
  assert.ok(addGroups(code, readServices(code)).groups.has('SVC_GROUP_monday_'));
});
