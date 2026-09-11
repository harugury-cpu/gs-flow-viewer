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
};
