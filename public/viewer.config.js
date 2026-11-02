/**
 * Project Flow Viewer 기본 설정.
 * 프로젝트별 설정은 이 파일을 고치지 않고 VIEWER_CONFIG 환경 변수로 지정한다.
 */
window.FLOW_VIEWER_CONFIG = {
  ui: {
    eyebrow: 'PROJECT FLOW',
    title: '프로젝트 흐름',
    subtitle: '실행 조건 · 판단 기준 · 결과',
    overviewTitle: '프로젝트 전체 흐름',
    overviewDescription: '구성 요소와 실행 흐름의 연결',
    filterLabel: '분류',
    relatedTitle: '이 흐름의 분류',
    legendTitle: '분류 색 범례',
    featuredBadge: '주요 진입점',
    featuredAnnotation: '주요 실행 진입점',
  },
  preferredGroups: [],
  filters: {
    items: {},
    aliases: [],
    fileMap: {},
  },
  /**
   * 서비스 아이콘(선택). 노드 라벨에 keys 중 하나가 들어 있으면 노드 왼쪽 위에 배지를 붙인다.
   * - badge: 1~3글자 글자 배지(기본). 상표 로고 라이선스 문제를 피하려고 기본값은 모두 글자 배지다.
   * - svg: 라이선스가 확인된 아이콘만 인라인 SVG 문자열로 넣는다(외부 URL 금지 — 오프라인 보장).
   * - enabled: false 로 기능 전체를 끈다.
   */
  icons: {
    enabled: true,
    items: [
      { id: 'sheets', keys: ['google sheets', '스프레드시트', 'spreadsheet', '시트'], badge: 'GS', color: '#188038' },
      { id: 'apps-script', keys: ['apps script', '앱스크립트', 'gas'], badge: 'AS', color: '#1a73e8' },
      { id: 'drive', keys: ['google drive', '드라이브'], badge: 'GD', color: '#f4b400' },
      { id: 'gmail', keys: ['gmail', '메일', 'email'], badge: 'GM', color: '#d93025' },
      { id: 'calendar', keys: ['calendar', '캘린더'], badge: 'GC', color: '#4285f4' },
      { id: 'monday', keys: ['monday', '먼데이'], badge: 'MD', color: '#ff3d57' },
      { id: 'slack', keys: ['slack', '슬랙'], badge: 'SL', color: '#611f69' },
      { id: 'github', keys: ['github', '깃허브'], badge: 'GH', color: '#24292f' },
      { id: 'webhook', keys: ['webhook', '웹훅'], badge: 'WH', color: '#5f6368' },
      { id: 'database', keys: ['database', 'db ', '데이터베이스', '저장'], badge: 'DB', color: '#00875a' },
    ],
  },
};
