/**
 * 보드 색상·필터 설정 (선택 사항).
 * 비워두면 뷰어는 순수 Mermaid 뷰어로만 동작한다(보드 필터/범례 UI 자동 숨김).
 *
 * 채우는 방법: diagrams.md를 생성할 때 함께, 또는 나중에 수동으로 아래 세 값을 채운다.
 *
 * boards: { [boardKey]: { id, name, mondayName, boardId, color, soft, webhook, webhookNote } }
 *   - id: boardKey와 동일한 문자열
 *   - color / soft: oklch() 또는 hex 색상. soft는 옅은 배경용
 *   - webhook: 이 보드에서 웹훅이 발생하면 true
 *
 * boardAliases: [{ keys: ['다이어그램 라벨에 등장하는 소문자 키워드'], board: 'boardKey' }]
 *   - Mermaid 노드 라벨 문자열로 보드를 역추론할 때 사용
 *
 * fileBoardMap: { '파일명.gs': ['boardKey', ...] }
 *   - 파일별 상세 화면에서 관련 보드 칩을 보여줄 때 사용
 */
window.BOARDS_CONFIG = {
  boards: {},
  boardAliases: [],
  fileBoardMap: {},
};
