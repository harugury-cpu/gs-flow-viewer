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
   * 서비스 아이콘(선택). 기본 아이콘 세트는 public/service-icons.js 에 있다.
   * 노드 라벨에 keys 중 하나가 들어 있으면 노드 안 위쪽에 큰 아이콘(34px)을 넣는다.
   * - items: 같은 id 는 기본값을 덮어쓰고, 새 id 는 추가된다. { id, title, color, keys, path(24x24 SVG path) }
   *   외부 URL은 쓰지 않는다(오프라인 보장). 상표 로고는 라이선스가 확인된 것만 넣는다.
   * - enabled: false 로 기능 전체를 끈다.
   */
  icons: {
    enabled: true,
    items: [],
  },
  /**
   * 선(화살표) 모양. 기본은 기존 Mermaid 곡선과 흐름 애니메이션이다.
   * - curve: 'basis'(기본 곡선) · 'linear' · 'step'(직각) · 'rounded'(직각 + 모서리 5px 둥글게)
   *   step/rounded를 선택할 때만 직각 경로 재배치·선 스타일을 적용한다.
   * - animate: false 로 흐름 애니메이션을 끈다.
   */
  edges: {
    curve: 'basis',
    animate: true,
  },
};
