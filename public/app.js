const state = {
  diagrams: [],
  activeId: null,
  renderSequence: 0,
  activeFilterId: null,
};

const elements = {
  backButton: document.querySelector('#backButton'),
  brandEyebrow: document.querySelector('#brandEyebrow'),
  brandSubtitle: document.querySelector('#brandSubtitle'),
  brandTitle: document.querySelector('#brandTitle'),
  dataStatus: document.querySelector('#dataStatus'),
  diagramError: document.querySelector('#diagramError'),
  diagramHint: document.querySelector('#diagramHint'),
  diagramKicker: document.querySelector('#diagramKicker'),
  diagramMount: document.querySelector('#diagramMount'),
  diagramNavList: document.querySelector('#diagramNavList'),
  diagramPanel: document.querySelector('#diagramPanel'),
  diagramPath: document.querySelector('#diagramPath'),
  diagramStatus: document.querySelector('#diagramStatus'),
  diagramTitle: document.querySelector('#diagramTitle'),
  legendList: document.querySelector('#legendList'),
  legendTitle: document.querySelector('#legendTitle'),
  navClearFilter: document.querySelector('#navClearFilter'),
  navFilterCount: document.querySelector('#navFilterCount'),
  navFilterLabel: document.querySelector('#navFilterLabel'),
  navToolbar: document.querySelector('#navToolbar'),
  overviewLegend: document.querySelector('#overviewLegend'),
  relatedFilterList: document.querySelector('#relatedFilterList'),
  relatedFiltersSection: document.querySelector('#relatedFiltersSection'),
  relatedTitle: document.querySelector('#relatedTitle'),
  sidebar: document.querySelector('.sidebar'),
  titleBlockFile: document.querySelector('#titleBlockFile'),
  titleBlockNodes: document.querySelector('#titleBlockNodes'),
  titleBlockFilter: document.querySelector('#titleBlockFilter'),
  titleBlockFilterLabel: document.querySelector('#titleBlockFilterLabel'),
  titleBlockStatus: document.querySelector('#titleBlockStatus'),
};

const mermaid = window.mermaid;

/** 프로젝트별 제목·그룹·필터 설정. 비어 있으면 순수 Mermaid 뷰어로 동작한다. */
const viewerConfig = window.FLOW_VIEWER_CONFIG || {};
const UI = {
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
  ...viewerConfig.ui,
};
const filtersConfig = viewerConfig.filters || {};
const FILTER_ITEMS = filtersConfig.items || {};
const FILTER_ALIASES = filtersConfig.aliases || [];
const FILE_FILTER_MAP = filtersConfig.fileMap || {};
const HAS_FILTER_ITEMS = Object.keys(FILTER_ITEMS).length > 0;

const GROUP_ORDER = [
  '전체',
  ...(Array.isArray(viewerConfig.preferredGroups) ? viewerConfig.preferredGroups : []),
  '기타',
];

function isFeatured(item) {
  return Boolean(item && item.featured);
}

function getItemNote(item) {
  return item ? (item.note || '') : '';
}

function getItemFullName(item) {
  return item ? (item.fullName || item.name || '') : '';
}

function applyUiConfig() {
  document.title = UI.title;
  elements.brandEyebrow.textContent = UI.eyebrow;
  elements.brandTitle.textContent = UI.title;
  elements.brandSubtitle.textContent = UI.subtitle;
  elements.relatedTitle.textContent = UI.relatedTitle;
  elements.legendTitle.textContent = UI.legendTitle;
  elements.titleBlockFilterLabel.textContent = `관련 ${UI.filterLabel}`;
}

function getOverview() {
  return state.diagrams.find((diagram) => diagram.title === '전체 구조') || state.diagrams[0];
}

function getDetailByFileName(fileName) {
  return state.diagrams.find((diagram) => (
    diagram.fileName === fileName || diagram.displayName === fileName
  ) && diagram.title !== '전체 구조');
}

function cleanFileName(fileName) {
  return String(fileName || '').replace(/\s+\(legacy\)\s*$/i, '').trim();
}

function getGroupName(diagram) {
  if (diagram.title === '전체 구조') {
    return '전체';
  }
  if (!diagram.title.includes('/')) {
    return '기타';
  }
  const parts = diagram.title.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : '기타';
}

function getFiltersForDiagram(diagram) {
  if (!diagram || diagram.title === '전체 구조') {
    return Object.values(FILTER_ITEMS).filter((filterItem) => isFeatured(filterItem));
  }
  const ids = FILE_FILTER_MAP[cleanFileName(diagram.fileName)] || [];
  return ids.map((id) => FILTER_ITEMS[id]).filter(Boolean);
}

function primaryFilter(diagram) {
  const filterItems = getFiltersForDiagram(diagram);
  return filterItems.find((filterItem) => isFeatured(filterItem)) || filterItems[0] || null;
}

function isOverviewDiagram(diagram) {
  return Boolean(diagram && (diagram.id === 'overview' || diagram.title === '전체 구조'));
}

function diagramMatchesFilter(diagram, filterId) {
  if (!filterId) {
    return true;
  }
  // 분류 필터 중에는 전체 구조를 결과에 넣지 않는다. 상세 파일만 좁혀 보여 준다.
  if (isOverviewDiagram(diagram)) {
    return false;
  }
  return getFiltersForDiagram(diagram).some((filterItem) => filterItem.id === filterId);
}

function getFilteredDiagrams(filterId = state.activeFilterId) {
  if (!filterId) {
    return state.diagrams.slice();
  }
  return state.diagrams.filter((diagram) => diagramMatchesFilter(diagram, filterId));
}

function getFirstFilteredDetail(filterId = state.activeFilterId) {
  return getFilteredDiagrams(filterId).find((diagram) => !isOverviewDiagram(diagram)) || null;
}

function setDataStatus(message, isError = false) {
  elements.dataStatus.textContent = message;
  elements.dataStatus.classList.toggle('is-error', isError);
}

function createChip(filterItem, { compact = false, active = false, onClick } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `chip${isFeatured(filterItem) ? ' is-featured' : ''}${active ? ' is-active' : ''}`;
  button.style.setProperty('--chip-color', filterItem.color);
  button.dataset.filterId = filterItem.id;
  button.setAttribute('role', 'listitem');
  button.title = `${getItemFullName(filterItem)}${isFeatured(filterItem) ? ` · ${UI.featuredBadge}: ${getItemNote(filterItem) || filterItem.name}` : ''}`;

  const swatch = document.createElement('span');
  swatch.className = 'chip__swatch';
  swatch.setAttribute('aria-hidden', 'true');
  button.append(swatch);

  const body = document.createElement('span');
  body.className = 'chip__body';

  const nameRow = document.createElement('span');
  nameRow.className = 'chip__name-row';

  const name = document.createElement('span');
  name.className = 'chip__name';
  name.textContent = filterItem.name;
  nameRow.append(name);

  if (isFeatured(filterItem)) {
    const badge = document.createElement('span');
    badge.className = 'chip__featured-badge';
    badge.textContent = UI.featuredBadge;
    nameRow.append(badge);
  }
  body.append(nameRow);

  if (!compact) {
    const meta = document.createElement('span');
    meta.className = 'chip__meta';
    meta.textContent = isFeatured(filterItem)
      ? `${UI.featuredBadge} · ${getItemNote(filterItem) || filterItem.name}`
      : UI.filterLabel;
    body.append(meta);
  }

  button.append(body);

  if (typeof onClick === 'function') {
    button.addEventListener('click', () => onClick(filterItem));
  }

  return button;
}

function renderLegend() {
  const fragment = document.createDocumentFragment();
  Object.values(FILTER_ITEMS).forEach((filterItem) => {
    fragment.append(
      createChip(filterItem, {
        compact: true,
        active: state.activeFilterId === filterItem.id,
        onClick: (selected) => setFilter(selected.id === state.activeFilterId ? null : selected.id),
      }),
    );
  });
  elements.legendList.replaceChildren(fragment);
}

function createNavButton(diagram, isOverview) {
  const button = document.createElement('button');
  const filterItem = primaryFilter(diagram);
  button.type = 'button';
  button.className = `nav-item${isOverview ? ' nav-item--overview' : ''}`;
  button.dataset.diagramId = diagram.id;
  button.title = isOverview ? '전체 구조' : diagram.fileName;
  button.style.setProperty('--item-color', filterItem ? filterItem.color : 'oklch(0.7 0.05 210)');
  button.setAttribute('aria-current', diagram.id === state.activeId ? 'page' : 'false');

  const rail = document.createElement('span');
  rail.className = 'nav-item__rail';
  rail.setAttribute('aria-hidden', 'true');
  button.append(rail);

  const content = document.createElement('span');
  content.className = 'nav-item__content';

  const label = document.createElement('span');
  label.className = 'nav-item__label';
  label.textContent = isOverview ? '전체 구조' : diagram.fileName;
  content.append(label);

  if (!isOverview) {
    const badges = document.createElement('span');
    badges.className = 'nav-item__badges';
    const filterItems = getFiltersForDiagram(diagram);
    if (filterItems.some((item) => isFeatured(item))) {
      const featuredBadge = document.createElement('span');
      featuredBadge.className = 'mini-badge mini-badge--featured';
      featuredBadge.textContent = UI.featuredBadge;
      badges.append(featuredBadge);
    }
    filterItems.slice(0, 3).forEach((item) => {
      const badge = document.createElement('span');
      badge.className = 'mini-badge';
      badge.style.setProperty('--badge-color', item.color);
      const dot = document.createElement('span');
      dot.className = 'mini-badge__dot';
      badge.append(dot, document.createTextNode(item.shortName || item.name));
      badges.append(badge);
    });
    if (badges.childNodes.length > 0) {
      content.append(badges);
    }
  }

  button.append(content);
  button.addEventListener('click', (event) => showDiagram(diagram.id, {
    reveal: true,
    focusPanel: event.detail === 0,
  }));
  return button;
}

function createNavEmptyState(filterItem) {
  const empty = document.createElement('div');
  empty.className = 'nav-empty';
  empty.setAttribute('role', 'status');

  const title = document.createElement('strong');
  title.textContent = filterItem ? `${filterItem.name} 연결 파일 없음` : '표시할 파일이 없습니다';

  const body = document.createElement('p');
  body.textContent = `필터를 해제하거나 다른 ${UI.filterLabel}를 선택하세요.`;

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'text-button text-button--on-dark';
  action.textContent = '필터 해제';
  action.addEventListener('click', () => setFilter(null));

  empty.append(title, body, action);
  return empty;
}

function updateNavToolbar(matchCount) {
  const filtering = Boolean(state.activeFilterId);
  const filterItem = state.activeFilterId ? FILTER_ITEMS[state.activeFilterId] : null;

  if (elements.sidebar) {
    elements.sidebar.classList.toggle('is-filtering', filtering);
  }
  if (elements.navToolbar) {
    elements.navToolbar.hidden = !filtering;
  }
  if (!filtering || !filterItem) {
    return;
  }

  if (elements.navFilterLabel) {
    elements.navFilterLabel.textContent = filterItem.name;
  }
  if (elements.navFilterCount) {
    elements.navFilterCount.textContent = `${matchCount}개 파일`;
  }
  if (elements.navToolbar) {
    elements.navToolbar.style.setProperty('--filter-color', filterItem.color);
  }
}

function renderNavigation() {
  const overview = getOverview();
  const filtering = Boolean(state.activeFilterId);
  const details = state.diagrams
    .filter((diagram) => !isOverviewDiagram(diagram))
    .filter((diagram) => diagramMatchesFilter(diagram, state.activeFilterId));
  const fragment = document.createDocumentFragment();

  updateNavToolbar(details.length);

  // 필터 없을 때만 전체 구조를 맨 위에 둔다.
  if (!filtering && overview) {
    fragment.append(createNavButton(overview, true));
  }

  if (filtering && details.length === 0) {
    fragment.append(createNavEmptyState(FILTER_ITEMS[state.activeFilterId]));
    elements.diagramNavList.replaceChildren(fragment);
    return;
  }

  const groups = new Map();
  details.forEach((diagram) => {
    const groupName = getGroupName(diagram);
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName).push(diagram);
  });

  GROUP_ORDER.forEach((groupName) => {
    const items = groups.get(groupName);
    if (!items || items.length === 0) {
      return;
    }
    const group = document.createElement('section');
    group.className = 'nav-group';
    group.setAttribute('aria-label', groupName);

    const title = document.createElement('h3');
    title.className = 'nav-group__title';
    title.textContent = groupName.toUpperCase();
    group.append(title);

    items.forEach((diagram) => {
      group.append(createNavButton(diagram, false));
    });

    fragment.append(group);
    groups.delete(groupName);
  });

  groups.forEach((items, groupName) => {
    const group = document.createElement('section');
    group.className = 'nav-group';
    const title = document.createElement('h3');
    title.className = 'nav-group__title';
    title.textContent = groupName.toUpperCase();
    group.append(title);
    items.forEach((diagram) => group.append(createNavButton(diagram, false)));
    fragment.append(group);
  });

  elements.diagramNavList.replaceChildren(fragment);
}

function updateNavigationState() {
  elements.diagramNavList.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.diagramId === state.activeId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function ensureActiveMatchesFilter() {
  const active = state.diagrams.find((diagram) => diagram.id === state.activeId);
  if (!state.activeFilterId) {
    return;
  }
  if (active && diagramMatchesFilter(active, state.activeFilterId)) {
    return;
  }
  const first = getFirstFilteredDetail();
  if (first) {
    showDiagram(first.id);
    return;
  }
  // 매칭 파일이 없으면 메인 영역도 필터 맥락을 유지한 채 안내만 남긴다.
  if (active && isOverviewDiagram(active)) {
    return;
  }
}

function setFilter(filterId) {
  state.activeFilterId = filterId;
  renderLegend();
  renderNavigation();
  updateNavigationState();
  ensureActiveMatchesFilter();

  const active = state.diagrams.find((diagram) => diagram.id === state.activeId);
  if (active) {
    renderRelatedFilters(active);
  }

  // 필터 적용 직후 파일 목록이 보이도록 네비 스크롤을 맨 위로.
  const nav = document.querySelector('.diagram-nav');
  if (nav) {
    nav.scrollTop = 0;
  }
}

function parseNodeLabels(code) {
  const nodeMap = new Map();
  const pattern = /\b([A-Za-z][A-Za-z0-9_-]*)\s*\[(?:\"([^\"]+)\"|([^\]]+))\]/g;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    const nodeId = match[1];
    const label = (match[2] || match[3] || '').trim();
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, label);
    }
  }
  return nodeMap;
}

function getInteractiveNodeMap(code) {
  const nodeMap = new Map();
  parseNodeLabels(code).forEach((label, nodeId) => {
    const fileName = cleanFileName(label);
    const detail = getDetailByFileName(fileName);
    if (detail) {
      nodeMap.set(nodeId, fileName);
    }
  });
  return nodeMap;
}

function openDetailByFileName(fileName) {
  const detail = getDetailByFileName(cleanFileName(fileName));
  if (detail) {
    showDiagram(detail.id, { reveal: true });
  }
}

function matchesRenderedNodeId(renderedId, nodeId) {
  const marker = `flowchart-${nodeId}-`;
  return renderedId.startsWith(marker) || renderedId.includes(`-${marker}`);
}

function resolveFilterFromLabel(label) {
  const normalized = String(label || '').toLowerCase();
  for (const alias of FILTER_ALIASES) {
    if (alias.keys.some((key) => normalized.includes(key))) {
      return FILTER_ITEMS[alias.item];
    }
  }

  const fileName = cleanFileName(label);
  const filterItems = FILE_FILTER_MAP[fileName];
  if (filterItems && filterItems.length > 0) {
    return FILTER_ITEMS[filterItems[0]];
  }
  return null;
}

function bindAccessibleNodes(nodeMap) {
  const nodes = [...elements.diagramMount.querySelectorAll('.node')];
  nodeMap.forEach((fileName, nodeId) => {
    const node = nodes.find((item) => matchesRenderedNodeId(item.id, nodeId));
    if (!node) {
      return;
    }
    node.classList.add('is-drilldown');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${fileName} 상세 흐름 열기`);
    node.addEventListener('click', () => openDetailByFileName(fileName));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetailByFileName(fileName);
      }
    });
  });
}

function colorizeRenderedNodes(code) {
  const labels = parseNodeLabels(code);
  const nodes = [...elements.diagramMount.querySelectorAll('.node')];

  labels.forEach((label, nodeId) => {
    const node = nodes.find((item) => matchesRenderedNodeId(item.id, nodeId));
    if (!node) {
      return;
    }
    if (nodeId === 'WHSRC' || label.startsWith(UI.featuredAnnotation)) {
      node.classList.add('is-featured-source');
      return;
    }
    const filterItem = resolveFilterFromLabel(label);
    if (!filterItem) {
      return;
    }
    node.classList.add('is-filter-colored');
    if (isFeatured(filterItem)) {
      node.classList.add('is-featured-filter');
    }
    node.style.setProperty('--node-fill', filterItem.soft);
    node.style.setProperty('--node-stroke', filterItem.color);
    if (state.activeFilterId && filterItem.id !== state.activeFilterId) {
      node.style.opacity = '0.42';
    } else {
      node.style.opacity = '1';
    }
  });
}

function getRenderedEdgeEndpoints(path) {
  const classes = [...path.classList];
  const from = classes.find((name) => name.startsWith('LS-'))?.slice(3);
  const to = classes.find((name) => name.startsWith('LE-'))?.slice(3);
  return from && to ? { from, to } : null;
}

function parseFlowEdges(code) {
  const edgePattern = /^\s*([A-Za-z][A-Za-z0-9_-]*)[\s\S]*?(?:-->|-\.->|==>)\s*([A-Za-z][A-Za-z0-9_-]*)/;
  return String(code || '')
    .split('\n')
    .map((line) => line.match(edgePattern))
    .filter(Boolean)
    .map((match) => ({ from: match[1], to: match[2] }));
}

/** Mermaid 연결 관계를 따라 Archify와 같은 단계별 trace 순서를 계산한다. */
function getFlowAnimationSteps(paths, code) {
  const sourceEdges = parseFlowEdges(code);
  const edges = paths.map((path, index) => ({
    path,
    index,
    endpoints: sourceEdges[index] || getRenderedEdgeEndpoints(path),
  }));
  const nodeIds = new Set();
  const incoming = new Map();
  const outgoing = new Map();

  edges.forEach((edge) => {
    if (!edge.endpoints) {
      return;
    }
    const { from, to } = edge.endpoints;
    nodeIds.add(from);
    nodeIds.add(to);
    incoming.set(to, (incoming.get(to) || 0) + 1);
    if (!outgoing.has(from)) {
      outgoing.set(from, []);
    }
    outgoing.get(from).push(edge);
  });

  const nodeSteps = new Map();
  const queue = [...nodeIds].filter((nodeId) => !incoming.has(nodeId));
  queue.forEach((nodeId) => nodeSteps.set(nodeId, 0));

  while (queue.length > 0) {
    const nodeId = queue.shift();
    const nextStep = Math.min((nodeSteps.get(nodeId) || 0) + 1, 12);
    (outgoing.get(nodeId) || []).forEach((edge) => {
      const target = edge.endpoints.to;
      if (!nodeSteps.has(target)) {
        nodeSteps.set(target, nextStep);
        queue.push(target);
      }
    });
  }

  return { edges, nodeSteps };
}

/** Archify trace: 원본 관계선이 실제 연결 단계에 맞춰 계속 흐른다. */
function addFlowAnimation(diagram, code) {
  const filterItem = primaryFilter(diagram);
  elements.diagramMount.style.setProperty('--flow-color', filterItem ? filterItem.color : 'var(--accent)');

  const paths = [...elements.diagramMount.querySelectorAll('.edgePaths path.flowchart-link')];
  const { edges, nodeSteps } = getFlowAnimationSteps(paths, code);
  edges.forEach((edge) => {
    const step = edge.endpoints && nodeSteps.has(edge.endpoints.from)
      ? nodeSteps.get(edge.endpoints.from)
      : Math.min(edge.index, 12);
    edge.path.classList.add('is-flow-animated');
    edge.path.style.setProperty('--flow-step', step);
  });
}

function revealDiagramPanel({ focus = false } = {}) {
  if (!elements.diagramPanel) {
    return;
  }

  const rect = elements.diagramPanel.getBoundingClientRect();
  const panelStartIsVisible = rect.top >= 0 && rect.top <= window.innerHeight * 0.45;
  if (!panelStartIsVisible) {
    elements.diagramPanel.scrollIntoView({ behavior: 'auto', block: 'start' });
    if (focus) {
      elements.diagramPanel.focus({ preventScroll: true });
    }
  }
}

function getFeaturedSourceFilters(diagram) {
  if (!diagram || isOverviewDiagram(diagram)) {
    return [];
  }
  return getFiltersForDiagram(diagram).filter((filterItem) => isFeatured(filterItem));
}

/** 상세 차트 상단에 설정된 주요 진입점과 분류명을 Mermaid 노드로 주입한다. */
function withFeaturedSourceAnnotation(code, diagram) {
  const featuredFilters = getFeaturedSourceFilters(diagram);
  if (featuredFilters.length === 0) {
    return code;
  }

  const names = featuredFilters.map((filterItem) => filterItem.name).join(' · ');
  const noteLabel = `- ${names}`;
  const annotation = [
    `  WHSRC(["${UI.featuredAnnotation}"])`,
    `  WHSRC_NOTE["${noteLabel}"]`,
    '  classDef whsrc fill:#FBFBFC,stroke:#1D7BD6,color:#0D0D0F,stroke-width:1.6px',
    '  classDef whsrcNote fill:transparent,stroke:transparent,color:#6B6B70,stroke-width:0px',
    '  class WHSRC whsrc',
    '  class WHSRC_NOTE whsrcNote',
  ].join('\n');

  // 이미 주입된 코드면 중복 추가하지 않는다.
  if (/\bWHSRC\b/.test(code) || code.includes(UI.featuredAnnotation)) {
    return code;
  }

  const lines = code.split('\n');
  const out = [];
  let inserted = false;
  for (const line of lines) {
    out.push(line);
    if (!inserted && /^\s*flowchart\b/i.test(line)) {
      out.push(annotation);
      inserted = true;
    }
  }
  if (!inserted) {
    out.unshift('flowchart TD', annotation);
  }
  return `${out.join('\n').trimEnd()}\n`;
}

function showRenderError(error) {
  const message = error instanceof Error ? error.message : String(error);
  elements.diagramStatus.textContent = '렌더링하지 못했습니다';
  elements.diagramError.hidden = false;
  elements.diagramError.textContent = `Mermaid 다이어그램을 표시하지 못했습니다. ${message}`;
  elements.diagramMount.replaceChildren();
}

function renderRelatedFilters(diagram) {
  if (!HAS_FILTER_ITEMS) {
    elements.overviewLegend.hidden = true;
    elements.relatedFiltersSection.hidden = true;
    return;
  }

  const isOverview = diagram === getOverview();
  elements.overviewLegend.hidden = !isOverview;
  elements.relatedFiltersSection.hidden = isOverview;

  if (isOverview) {
    renderLegend();
    return;
  }

  const filterItems = getFiltersForDiagram(diagram);
  const fragment = document.createDocumentFragment();
  if (filterItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diagram-path';
    empty.textContent = `이 파일은 특정 ${UI.filterLabel}에 연결되지 않았습니다.`;
    fragment.append(empty);
  } else {
    filterItems.forEach((filterItem) => {
      fragment.append(
        createChip(filterItem, {
          compact: true,
          active: state.activeFilterId === filterItem.id,
          onClick: (selected) => setFilter(selected.id === state.activeFilterId ? null : selected.id),
        }),
      );
    });
  }
  elements.relatedFilterList.replaceChildren(fragment);
}

function setTitleBlock({ file, nodes, filterItem, status }) {
  if (elements.titleBlockFile && file !== undefined) {
    elements.titleBlockFile.textContent = file;
  }
  if (elements.titleBlockNodes && nodes !== undefined) {
    elements.titleBlockNodes.textContent = nodes;
  }
  if (elements.titleBlockFilter && filterItem !== undefined) {
    elements.titleBlockFilter.textContent = filterItem;
  }
  if (elements.titleBlockStatus && status !== undefined) {
    elements.titleBlockStatus.textContent = status;
  }
}

async function renderDiagram(diagram) {
  elements.diagramError.hidden = true;
  elements.diagramStatus.textContent = '렌더링 중';
  setTitleBlock({ status: 'RENDERING' });

  const isOverview = diagram === getOverview();
  const interactiveNodes = isOverview ? getInteractiveNodeMap(diagram.mermaidCode) : new Map();
  const annotatedCode = withServiceIconSlots(isOverview
    ? diagram.mermaidCode
    : withFeaturedSourceAnnotation(diagram.mermaidCode, diagram));
  const source = annotatedCode;
  const renderSequence = ++state.renderSequence;
  const renderId = `mermaid-diagram-${renderSequence}`;

  try {
    const result = await mermaid.render(renderId, source);
    if (renderSequence !== state.renderSequence || diagram.id !== state.activeId) {
      return;
    }

    elements.diagramMount.innerHTML = result.svg;
    if (typeof result.bindFunctions === 'function') {
      result.bindFunctions(elements.diagramMount);
    }
    bindAccessibleNodes(interactiveNodes);
    colorizeRenderedNodes(annotatedCode);
    addServiceIcons();
    const groups = styleGroups();
    const orthogonal = ['step', 'rounded'].includes(EDGES_CONFIG.curve);
    elements.diagramMount.querySelector('svg')?.classList.toggle('has-orthogonal-edges', orthogonal);
    if (orthogonal) {
      rerouteEdges(annotatedCode);
      styleEdges(groups);
    }
    if (EDGES_CONFIG.animate !== false) {
      addFlowAnimation(diagram, annotatedCode);
    }
    elements.diagramStatus.textContent = '렌더링 완료';
    const featuredFilters = getFeaturedSourceFilters(diagram);
    elements.diagramHint.textContent = isOverview
      ? '구성 요소 노드를 클릭하면 실행 조건과 분기 기준을 볼 수 있습니다'
        : featuredFilters.length > 0
        ? `${UI.featuredBadge} - ${featuredFilters.map((filterItem) => filterItem.name).join(' · ')}`
        : HAS_FILTER_ITEMS
          ? `이 흐름의 ${UI.filterLabel} 칩으로 필터하거나 사이드바에서 다른 파일로 이동`
          : '사이드바에서 다른 파일로 이동';

    const filterItem = primaryFilter(diagram);
    const nodeCount = elements.diagramMount.querySelectorAll('.node').length;
    setTitleBlock({
      nodes: nodeCount,
      filterItem: filterItem ? filterItem.name : '—',
      status: 'RENDERED',
    });
  } catch (error) {
    if (renderSequence === state.renderSequence && diagram.id === state.activeId) {
      showRenderError(error);
      setTitleBlock({ status: 'ERROR' });
    }
  }
}

async function showDiagram(diagramId, { reveal = false, focusPanel = false } = {}) {
  const diagram = state.diagrams.find((item) => item.id === diagramId);
  if (!diagram) {
    return;
  }

  state.activeId = diagram.id;
  updateNavigationState();

  const isOverview = diagram === getOverview();
  elements.backButton.hidden = isOverview;
  elements.diagramKicker.textContent = isOverview ? '전체 구조' : getGroupName(diagram);
  elements.diagramTitle.textContent = isOverview ? UI.overviewTitle : diagram.displayName;
  elements.diagramPath.textContent = isOverview
    ? UI.overviewDescription
    : getGroupName(diagram);

  renderRelatedFilters(diagram);
  setTitleBlock({ file: isOverview ? '전체 구조' : diagram.displayName });
  await renderDiagram(diagram);
  if (reveal && diagram.id === state.activeId) {
    revealDiagramPanel({ focus: focusPanel });
  }
}

function showLoadError(error) {
  const message = error instanceof Error ? error.message : String(error);
  setDataStatus('원본 로드 실패', true);
  elements.diagramStatus.textContent = '데이터를 불러오지 못했습니다';
  elements.diagramError.hidden = false;
  elements.diagramError.textContent = `다이어그램 데이터를 불러오지 못했습니다. ${message}`;
  elements.diagramTitle.textContent = '데이터 로드 실패';
}

async function fetchDiagrams() {
  // 내보낸 단일 HTML에서는 데이터가 페이지 안에 들어 있으므로 네트워크 요청을 하지 않는다.
  if (Array.isArray(window.FLOW_VIEWER_EMBEDDED_DIAGRAMS)) {
    return window.FLOW_VIEWER_EMBEDDED_DIAGRAMS;
  }
  const response = await fetch('/diagrams.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function loadDiagrams() {
  try {
    state.diagrams = await fetchDiagrams();
    if (!Array.isArray(state.diagrams) || state.diagrams.length === 0) {
      throw new Error('다이어그램 항목이 없습니다.');
    }

    renderNavigation();
    const filterCount = Object.keys(FILTER_ITEMS).length;
    setDataStatus(`${state.diagrams.length}개 다이어그램${filterCount ? ` · ${UI.filterLabel} ${filterCount}개` : ''}`);
    await showDiagram(getOverview().id);
  } catch (error) {
    showLoadError(error);
  }
}

elements.backButton.addEventListener('click', () => {
  // 필터 중 전체 구조로 돌아갈 때는 필터도 함께 풀어 목록이 다시 열리게 한다.
  if (state.activeFilterId) {
    setFilter(null);
  }
  showDiagram(getOverview().id, { reveal: true });
});
if (elements.navClearFilter) {
  elements.navClearFilter.addEventListener('click', () => setFilter(null));
}

/* ——— 서비스 아이콘 (노드 안 위쪽, 34px) ———
 * 레이아웃 아이디어: caru-ini/stack-diagram(MIT © caru-ini)의 "로고 + 라벨" 타일. 코드는 새로 작성.
 * 렌더 전에 라벨 앞에 빈 자리(.svc-slot)를 넣어 Mermaid가 노드 크기를 아이콘까지 포함해 계산하게 하고,
 * 렌더 후 그 자리에 인라인 SVG를 채운다. 그래서 화살표·라벨이 아이콘에 가려지지 않는다.
 */
const ICONS_CONFIG = viewerConfig.icons || {};
const ICON_ITEMS = (() => {
  if (ICONS_CONFIG.enabled === false) {
    return [];
  }
  const merged = new Map();
  (window.FLOW_VIEWER_SERVICE_ICONS || []).forEach((item) => merged.set(item.id, item));
  (Array.isArray(ICONS_CONFIG.items) ? ICONS_CONFIG.items : []).forEach((item) => {
    merged.set(item.id, { ...(merged.get(item.id) || {}), ...item });
  });
  return [...merged.values()].filter((item) => item.path && Array.isArray(item.keys));
})();
const ICON_BY_ID = new Map(ICON_ITEMS.map((item) => [item.id, item]));
const SVG_NS = 'http://www.w3.org/2000/svg';

function resolveServiceIcon(label) {
  // 줄바꿈과 강조 태그는 표시 문구를 바꾸지 않으므로 텍스트로 매칭한다.
  const normalized = String(label || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  return ICON_ITEMS.find((item) => item.keys.some((key) => normalized.includes(String(key).toLowerCase()))) || null;
}

/**
 * subgraph 제목에는 노드용 큰 아이콘 대신 제목 앞 작은 아이콘(14px)을 넣는다.
 * (묶음 제목 왼쪽 위 + 작은 로고 배치 아이디어: caru-ini/stack-diagram, MIT © caru-ini — 코드는 새로 작성)
 */
function withGroupIconSlot(line) {
  const match = line.match(/^(\s*subgraph\s+)([A-Za-z][A-Za-z0-9_-]*)\s*(?:\[(?:"([^"]+)"|([^\]"]+))\])?\s*$/);
  if (!match) {
    return line;
  }
  const [, prefix, groupId, quoted, plain] = match;
  const label = (quoted || plain || groupId).trim();
  const icon = /svc-slot/.test(label) ? null : resolveServiceIcon(label);
  if (!icon) {
    return line;
  }
  const safe = label.replace(/"/g, '#quot;');
  return `${prefix}${groupId}["<span class='svc-slot svc-slot--group' data-svc='${icon.id}'></span>${safe}"]`;
}

/** 사각형·둥근 노드 라벨 앞에 아이콘 자리를 넣고 기존 줄바꿈·강조는 보존한다. */
function withServiceIconSlots(code) {
  if (ICON_ITEMS.length === 0) {
    return code;
  }
  return String(code)
    .split('\n')
    .map((line) => (/^\s*subgraph\b/.test(line) ? withGroupIconSlot(line) : withNodeIconSlots(line)))
    .join('\n');
}

function withNodeIconSlots(line) {
  const pattern = /\b([A-Za-z][A-Za-z0-9_-]*)(\(?)\[(?:"([^"]+)"|([^\]"]+))\](\)?)/g;
  return line.replace(pattern, (all, nodeId, openRound, quoted, plain, closeRound) => {
    const label = (quoted || plain || '').trim();
    if (/svc-slot/.test(label) || nodeId === 'WHSRC' || nodeId === 'WHSRC_NOTE') {
      return all;
    }
    const icon = resolveServiceIcon(label);
    if (!icon) {
      return all;
    }
    const cylinder = !openRound && /^\(.*\)$/.test(label);
    const inner = cylinder ? label.slice(1, -1).trim() : label;
    const safe = inner.replace(/"/g, '#quot;');
    if (cylinder) {
      return `${nodeId}[("<span class='svc-slot' data-svc='${icon.id}'></span>${safe}")]`;
    }
    return `${nodeId}${openRound}["<span class='svc-slot' data-svc='${icon.id}'></span>${safe}"]${closeRound}`;
  });
}

function addServiceIcons() {
  elements.diagramMount.querySelectorAll('.svc-slot').forEach((slot) => {
    const icon = ICON_BY_ID.get(slot.dataset.svc);
    if (!icon || slot.firstChild) {
      return;
    }
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', `svc-icon svc-icon--${icon.source || 'custom'}`);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', icon.path);
    path.style.fill = icon.color || '#5f6368';
    svg.append(path);
    slot.title = icon.title || icon.id;
    slot.append(svg);
    const node = slot.closest('.node');
    if (node && !slot.classList.contains('svc-slot--group')) {
      node.classList.add('has-service-icon');
      node.dataset.iconId = icon.id;
    }
  });
}

/* ——— 선(화살표)·묶음 박스 스타일 ———
 * 선 문법 아이디어: caru-ini/stack-diagram(MIT © caru-ini)의 references/geometry.md
 * (직각 선, 주 흐름=강조색 실선, 내부·배포=회색 점선, 같은 색 채운 삼각 화살촉, 배경색 halo 라벨, 왼쪽 위 묶음 제목).
 * Mermaid 출력에 맞춰 코드는 새로 작성했다.
 * - `-->`  : 주 흐름(강조색 실선)
 * - `-.->` : 보조·배포·비동기(회색 점선)
 * - `==>`  : 핵심 경로(강조색 굵은 실선)
 */
const EDGES_CONFIG = viewerConfig.edges || {};

function edgeKind(path) {
  if (path.classList.contains('edge-pattern-dotted') || path.classList.contains('edge-pattern-dashed')) {
    return 'dashed';
  }
  return path.classList.contains('edge-thickness-thick') ? 'strong' : 'primary';
}

function rectOf(element) {
  return {
    x: Number(element.getAttribute('x')) || 0,
    y: Number(element.getAttribute('y')) || 0,
    width: Number(element.getAttribute('width')) || 0,
    height: Number(element.getAttribute('height')) || 0,
  };
}

function containsPoint(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function parseTranslate(element) {
  const match = String(element.getAttribute('transform') || '').match(/translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)/);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
}

/** 묶음 박스: 둥근 모서리, 묶음마다 번갈아 색, 중첩은 점선, 제목은 왼쪽 위. 가장 안쪽 묶음 목록을 돌려준다. */
function styleGroups() {
  const clusters = [...elements.diagramMount.querySelectorAll('g.cluster')]
    .map((cluster) => ({ cluster, rectElement: cluster.querySelector(':scope > rect') }))
    .filter((item) => item.rectElement)
    .map((item) => ({ ...item, rect: rectOf(item.rectElement) }));

  clusters.forEach((item, index) => {
    const { cluster, rectElement, rect } = item;
    const parent = clusters.find((other) => other !== item
      && containsPoint(other.rect, rect.x, rect.y)
      && containsPoint(other.rect, rect.x + rect.width, rect.y + rect.height));
    cluster.classList.add('flow-group', index % 2 === 0 ? 'flow-group--a' : 'flow-group--b');
    cluster.classList.toggle('flow-group--nested', Boolean(parent));
    rectElement.setAttribute('rx', '12');
    rectElement.setAttribute('ry', '12');

    const label = cluster.querySelector(':scope > .cluster-label');
    if (label) {
      label.setAttribute('transform', `translate(${rect.x + 12}, ${rect.y + 8})`);
      const box = label.querySelector('foreignObject > div');
      if (box) {
        box.style.textAlign = 'left';
      }
    }
  });
  return clusters;
}

/* 직각 경로 다시 잡기:
 * Mermaid의 'step' 곡선은 끝점이 노드 모서리 근처에 찍혀 화살표가 노드 변을 따라 옆으로 들어가는 일이 있다.
 * stack-diagram geometry.md 의 규칙(변 가운데에서 나가 변 가운데로 들어감, 꺾임은 노드 사이 빈 띠, 노드 상자를 지나지 않음)대로
 * 경로를 다시 계산하고, 다른 노드·묶음 제목·라벨을 지나가면 Mermaid 경로를 그대로 둔다.
 */
const ARROW_GAP = 4;
const OBSTACLE_PAD = 6;

function toLocalRect(element, ctmInverse) {
  const box = element.getBoundingClientRect();
  const a = new DOMPoint(box.left, box.top).matrixTransform(ctmInverse);
  const b = new DOMPoint(box.right, box.bottom).matrixTransform(ctmInverse);
  return { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) };
}

function segmentHitsRect(p, q, rect, pad = OBSTACLE_PAD) {
  const left = Math.min(p.x, q.x);
  const right = Math.max(p.x, q.x);
  const top = Math.min(p.y, q.y);
  const bottom = Math.max(p.y, q.y);
  return right > rect.left - pad && left < rect.right + pad && bottom > rect.top - pad && top < rect.bottom + pad;
}

function boxesOverlap(a, b, pad = 2) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function getFlowDirection(code) {
  const match = String(code || '').match(/^\s*(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)\b/m);
  return match && (match[1] === 'LR' || match[1] === 'RL') ? 'horizontal' : 'vertical';
}

function splitEdgeId(dataId, nodeIds) {
  const match = String(dataId || '').match(/^L_(.+)_\d+$/);
  if (!match) {
    return null;
  }
  const body = match[1];
  for (let index = body.indexOf('_'); index > 0; index = body.indexOf('_', index + 1)) {
    const from = body.slice(0, index);
    const to = body.slice(index + 1);
    if (nodeIds.has(from) && nodeIds.has(to)) {
      return { from, to };
    }
  }
  return null;
}

/** 두 상자 사이 직각 경로 후보. axis 'h'는 옆변끼리, 'v'는 윗변·아랫변끼리 잇는다. */
function orthogonalCandidates(source, target, axis, blockers = [], sharedElbow = null) {
  const candidates = [];
  const allowShortcut = source.isBox && target.isBox;
  if (axis === 'h') {
    const forward = target.left >= source.right;
    const sx = forward ? source.right : source.left;
    const tx = forward ? target.left - ARROW_GAP : target.right + ARROW_GAP;
    // 원통·둥근 노드는 옆벽 가운데 60%만 곧은 면으로 본다.
    const inner = (rect) => (rect.isBox ? [rect.top, rect.bottom] : [
      rect.top + (rect.bottom - rect.top) * 0.2,
      rect.bottom - (rect.bottom - rect.top) * 0.2,
    ]);
    const overlapTop = Math.max(inner(source)[0], inner(target)[0]);
    const overlapBottom = Math.min(inner(source)[1], inner(target)[1]);
    if (source.hasSideWalls && target.hasSideWalls && overlapBottom - overlapTop >= 12) {
      const y = (overlapTop + overlapBottom) / 2;
      candidates.push([{ x: sx, y }, { x: tx, y }]);
    }
    const sy = (source.top + source.bottom) / 2;
    const ty = (target.top + target.bottom) / 2;
    const gap = Math.abs(tx - sx);
    // 같은 노드에서 갈라지는 선은 같은 자리에서 꺾어 줄기 하나로 보이게 한다.
    const elbows = [0.5, 0.25, 0.75].map((ratio) => ({ at: sx + (tx - sx) * ratio, room: gap * Math.min(ratio, 1 - ratio) }));
    if (sharedElbow !== null) {
      elbows.unshift({ at: sharedElbow, room: Math.min(Math.abs(sharedElbow - sx), Math.abs(tx - sharedElbow)) });
    }
    elbows.forEach(({ at: mx, room }) => {
      if (room >= 10) {
        candidates.push([{ x: sx, y: sy }, { x: mx, y: sy }, { x: mx, y: ty }, { x: tx, y: ty }]);
      }
    });
    // 사이에 다른 노드가 있으면 그 노드 위·아래 빈 띠로 돌아간다.
    const direction = Math.sign(tx - sx) || 1;
    const x1 = sx + direction * 14;
    const x2 = tx - direction * 18;
    detourLanes(blockers, 'h', Math.min(x1, x2), Math.max(x1, x2), (sy + ty) / 2).forEach((lane) => {
      candidates.push([{ x: sx, y: sy }, { x: x1, y: sy }, { x: x1, y: lane }, { x: x2, y: lane }, { x: x2, y: ty }, { x: tx, y: ty }]);
    });
    return candidates;
  }
  const forward = target.top >= source.bottom;
  const sy = forward ? source.bottom : source.top;
  const ty = forward ? target.top - ARROW_GAP : target.bottom + ARROW_GAP;
  const overlapLeft = Math.max(source.left, target.left);
  const overlapRight = Math.min(source.right, target.right);
  const sxCenter = (source.left + source.right) / 2;
  const txCenter = (target.left + target.right) / 2;
  if (overlapRight - overlapLeft >= 12 && (allowShortcut || Math.abs(sxCenter - txCenter) < 2)) {
    const x = Math.abs(sxCenter - txCenter) < 2 ? sxCenter : (overlapLeft + overlapRight) / 2;
    candidates.push([{ x, y: sy }, { x, y: ty }]);
  }
  const gap = Math.abs(ty - sy);
  const elbows = [0.5, 0.3, 0.7].map((ratio) => ({ at: sy + (ty - sy) * ratio, room: gap * Math.min(ratio, 1 - ratio) }));
  if (sharedElbow !== null) {
    elbows.unshift({ at: sharedElbow, room: Math.min(Math.abs(sharedElbow - sy), Math.abs(ty - sharedElbow)) });
  }
  elbows.forEach(({ at: my, room }) => {
    if (room >= 10) {
      candidates.push([{ x: sxCenter, y: sy }, { x: sxCenter, y: my }, { x: txCenter, y: my }, { x: txCenter, y: ty }]);
    }
  });
  const direction = Math.sign(ty - sy) || 1;
  const y1 = sy + direction * 14;
  const y2 = ty - direction * 18;
  detourLanes(blockers, 'v', Math.min(y1, y2), Math.max(y1, y2), (sxCenter + txCenter) / 2).forEach((lane) => {
    candidates.push([{ x: sxCenter, y: sy }, { x: sxCenter, y: y1 }, { x: lane, y: y1 }, { x: lane, y: y2 }, { x: txCenter, y: y2 }, { x: txCenter, y: ty }]);
  });
  return candidates;
}

/** 우회 통로 후보: from~to 구간을 가로막는 노드들의 바깥쪽 선(20px 띄움), 가까운 순. */
function detourLanes(blockers, axis, from, to, center) {
  const lanes = [];
  blockers.forEach((rect) => {
    const [start, end] = axis === 'v' ? [rect.top, rect.bottom] : [rect.left, rect.right];
    if (end < from || start > to) {
      return;
    }
    if (axis === 'v') {
      lanes.push(rect.left - 20, rect.right + 20);
    } else {
      lanes.push(rect.top - 20, rect.bottom + 20);
    }
  });
  return [...new Set(lanes.map((lane) => Math.round(lane)))]
    .sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
    .slice(0, 8);
}

function pathFromPoints(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join('');
}

/**
 * 라벨 자리: 가로 구간은 선 위(stack-diagram: y = lineY - 8), 세로 구간은 선 오른쪽(x = lineX + 10).
 * 긴 구간부터 보고, 노드·묶음 제목·다른 라벨과 겹치지 않는 첫 자리를 쓴다.
 */
function placeEdgeLabel(points, size, obstacles, groups = []) {
  const segments = points.slice(1)
    .map((point, index) => ({ p: points[index], q: point }))
    .map((segment) => ({ ...segment, length: Math.abs(segment.q.x - segment.p.x) + Math.abs(segment.q.y - segment.p.y) }))
    .sort((a, b) => b.length - a.length);
  for (const { p, q, length } of segments) {
    const horizontal = Math.abs(q.y - p.y) < 0.5;
    if (length < (horizontal ? size.width : size.height) + 8) {
      continue;
    }
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    const centers = horizontal
      ? [{ x: mid.x, y: mid.y - size.height / 2 - 2 }, { x: mid.x, y: mid.y + size.height / 2 + 2 }]
      : [{ x: mid.x + 10 + size.width / 2, y: mid.y }, { x: mid.x - 10 - size.width / 2, y: mid.y }];
    for (const center of centers) {
      const box = {
        left: center.x - size.width / 2,
        right: center.x + size.width / 2,
        top: center.y - size.height / 2,
        bottom: center.y + size.height / 2,
      };
      const straddlesGroup = groups.some((rect) => boxesOverlap(box, rect, 0)
        && !(box.left >= rect.left && box.right <= rect.right && box.top >= rect.top && box.bottom <= rect.bottom));
      if (!straddlesGroup && !obstacles.some((rect) => boxesOverlap(box, rect))) {
        return { center, box };
      }
    }
  }
  return null;
}

/** 같은 축에서 3px 안으로 겹쳐 달리는 구간이 있으면 선이 합쳐져 보이므로 피한다. */
function runsAlong(p, q, segment) {
  const horizontal = Math.abs(q.y - p.y) < 0.5;
  const other = Math.abs(segment.q.y - segment.p.y) < 0.5;
  if (horizontal !== other) {
    return false;
  }
  if (horizontal) {
    return Math.abs(p.y - segment.p.y) < 3
      && Math.min(Math.max(p.x, q.x), Math.max(segment.p.x, segment.q.x)) - Math.max(Math.min(p.x, q.x), Math.min(segment.p.x, segment.q.x)) > 2;
  }
  return Math.abs(p.x - segment.p.x) < 3
    && Math.min(Math.max(p.y, q.y), Math.max(segment.p.y, segment.q.y)) - Math.max(Math.min(p.y, q.y), Math.min(segment.p.y, segment.q.y)) > 2;
}

function rerouteEdges(code) {
  const mount = elements.diagramMount;
  const paths = [...mount.querySelectorAll('.edgePaths path.flowchart-link')];
  if (paths.length === 0) {
    return;
  }
  const ctm = paths[0].getScreenCTM();
  if (!ctm) {
    return;
  }
  const toLocal = ctm.inverse();
  const nodes = new Map();
  mount.querySelectorAll('g.node').forEach((node) => {
    const match = node.id.match(/flowchart-(.+)-\d+$/);
    if (match) {
      // 사각형이 아닌 노드(분기 마름모·원통·원)는 변 가운데(꼭짓점)에서만 선을 잇는다.
      const shape = node.querySelector(':scope > rect, :scope > polygon, :scope > path, :scope > circle, :scope > g');
      const tag = shape ? shape.tagName.toLowerCase() : '';
      nodes.set(match[1], { ...toLocalRect(node, toLocal), isBox: tag === 'rect', hasSideWalls: tag === 'rect' || tag === 'path' });
    }
  });
  const groupTitles = [...mount.querySelectorAll('g.cluster > .cluster-label')].map((label) => toLocalRect(label, toLocal));
  const groupBoxes = [...mount.querySelectorAll('g.cluster > rect')].map((rect) => toLocalRect(rect, toLocal));
  const labelsById = new Map();
  mount.querySelectorAll('.edgeLabels > .edgeLabel').forEach((edgeLabel) => {
    const inner = edgeLabel.querySelector('.label[data-id]');
    const foreign = edgeLabel.querySelector('foreignObject');
    if (inner && foreign && edgeLabel.textContent.trim()) {
      // 라벨 글꼴(mono)이 Mermaid가 잰 글꼴보다 넓으므로 실제 크기로 다시 맞춘다.
      const text = foreign.querySelector('span.edgeLabel') || foreign.firstElementChild;
      const scale = Math.hypot(ctm.a, ctm.b) || 1;
      const measured = text ? text.getBoundingClientRect() : null;
      const size = measured && measured.width > 0
        ? { width: Math.ceil(measured.width / scale) + 2, height: Math.ceil(measured.height / scale) + 2 }
        : { width: Number(foreign.getAttribute('width')) || 0, height: Number(foreign.getAttribute('height')) || 0 };
      foreign.setAttribute('width', String(size.width));
      foreign.setAttribute('height', String(size.height));
      inner.setAttribute('transform', `translate(${-size.width / 2}, ${-size.height / 2})`);
      labelsById.set(inner.dataset.id, { element: edgeLabel, size });
    }
  });

  const preferred = getFlowDirection(code) === 'horizontal' ? 'h' : 'v';
  const nodeIds = new Set(nodes.keys());
  const placedLabels = [];
  const placedSegments = [];
  const elbowBySource = new Map();

  paths.forEach((path) => {
    const ends = splitEdgeId(path.dataset.id, nodeIds);
    if (!ends || ends.from === ends.to) {
      return;
    }
    const source = nodes.get(ends.from);
    const target = nodes.get(ends.to);
    const gapX = Math.max(target.left - source.right, source.left - target.right);
    const gapY = Math.max(target.top - source.bottom, source.top - target.bottom);
    if (gapX <= 8 && gapY <= 8) {
      return;
    }
    const axes = [];
    const gapOf = (axis) => (axis === 'h' ? gapX : gapY);
    const other = preferred === 'h' ? 'v' : 'h';
    [preferred, other].sort((a, b) => (gapOf(b) > 8) - (gapOf(a) > 8)).forEach((axis) => {
      if (gapOf(axis) > 8) {
        axes.push(axis);
      }
    });

    const blockers = [...nodes.entries()]
      .filter(([id]) => id !== ends.from && id !== ends.to)
      .map(([, rect]) => rect)
      .concat(groupTitles);
    const label = labelsById.get(path.dataset.id);
    const kind = edgeKind(path);

    for (const axis of axes) {
      const sharedElbow = elbowBySource.has(`${ends.from}:${axis}`) ? elbowBySource.get(`${ends.from}:${axis}`) : null;
      for (const points of orthogonalCandidates(source, target, axis, blockers, sharedElbow)) {
        // 같은 노드에서 갈라지거나 모이는 선은 줄기를 같이 써도 된다(stack-diagram 예시의 분기 모양).
        const clear = points.slice(1).every((point, index) => (
          !blockers.some((rect) => segmentHitsRect(points[index], point, rect))
          && !placedSegments.some((segment) => !(segment.kind === kind && (segment.from === ends.from || segment.to === ends.to))
            && runsAlong(points[index], point, segment))
          && !placedLabels.some((rect) => segmentHitsRect(points[index], point, rect, 2))
        ));
        if (!clear) {
          continue;
        }
        let placement = null;
        if (label) {
          placement = placeEdgeLabel(points, label.size, [...nodes.values(), ...groupTitles, ...placedLabels], groupBoxes);
          if (!placement) {
            continue;
          }
        }
        path.setAttribute('d', pathFromPoints(points));
        path.classList.add('is-rerouted');
        points.slice(1).forEach((point, index) => placedSegments.push({ p: points[index], q: point, kind, ...ends }));
        if (points.length === 4 && !elbowBySource.has(`${ends.from}:${axis}`)) {
          elbowBySource.set(`${ends.from}:${axis}`, axis === 'h' ? points[1].x : points[1].y);
        }
        if (label && placement) {
          const screen = new DOMPoint(placement.center.x, placement.center.y).matrixTransform(ctm);
          const parentCtm = label.element.parentNode.getScreenCTM();
          const local = parentCtm ? screen.matrixTransform(parentCtm.inverse()) : placement.center;
          label.element.setAttribute('transform', `translate(${local.x}, ${local.y})`);
          placedLabels.push(placement.box);
        }
        return;
      }
    }
    if (label) {
      const current = toLocalRect(label.element, toLocal);
      placedLabels.push(current);
    }
  });
}

function styleEdges(clusters) {
  const mount = elements.diagramMount;
  const kinds = new Map();
  mount.querySelectorAll('.edgePaths path.flowchart-link').forEach((path) => {
    const kind = edgeKind(path);
    path.classList.add('flow-edge', `flow-edge--${kind}`);
    if (path.dataset.id) {
      kinds.set(path.dataset.id, kind);
    }
  });

  mount.querySelectorAll('.edgeLabels > .edgeLabel').forEach((edgeLabel) => {
    const inner = edgeLabel.querySelector('.label[data-id]');
    const kind = (inner && kinds.get(inner.dataset.id)) || 'primary';
    edgeLabel.classList.add('flow-edge-label', `flow-edge-label--${kind}`);
    if (!edgeLabel.textContent.trim()) {
      edgeLabel.classList.add('is-empty');
      return;
    }
    // 라벨 halo 색은 라벨이 놓인 면(묶음 안이면 그 묶음 색)에 맞춘다.
    const { x, y } = parseTranslate(edgeLabel);
    const host = clusters
      .filter((item) => containsPoint(item.rect, x, y))
      .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];
    if (host) {
      edgeLabel.classList.add(host.cluster.classList.contains('flow-group--b') ? 'is-on-group-b' : 'is-on-group-a');
    }
  });

  // 화살촉: 채운 삼각형, 선 굵기에 맞춘 크기. 색은 CSS에서 선 색(context-stroke)을 따른다.
  mount.querySelectorAll('marker[id$="-pointEnd"], marker[id$="-pointStart"]').forEach((marker) => {
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', marker.id.endsWith('-pointEnd') ? '6' : '4');
  });
}

/* ——— 라이트·다크 테마 ——— */
const THEME_STORAGE_KEY = 'flow-viewer-theme';
const themeToggle = document.querySelector('#themeToggle');

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function syncThemeToggle() {
  if (!themeToggle) {
    return;
  }
  const dark = currentTheme() === 'dark';
  themeToggle.textContent = dark ? '라이트 테마' : '다크 테마';
  themeToggle.setAttribute('aria-pressed', String(dark));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme());
  } catch (error) {
    // file:// 등에서 저장소를 못 쓰면 이번 화면에만 적용한다.
  }
  syncThemeToggle();
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
}
syncThemeToggle();

/* ——— HTML 한 장으로 내보내기 ———
 * 아이디어: caru-ini/stack-diagram(MIT © caru-ini)의 "폰트·로고를 인라인한 단일 HTML".
 * 구현은 이 저장소용으로 새로 작성했다. mermaid·CSS·설정·데이터·앱 코드를 모두 페이지에 넣어
 * file:// 로 열어도 외부 요청이 없다.
 */
const exportButton = document.querySelector('#exportButton');

function escapeInlineScript(source) {
  return String(source).replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${url} HTTP ${response.status}`);
  }
  return response.text();
}

async function buildStandaloneHtml() {
  const [css, mermaidSource, iconsSource, configSource, appSource] = await Promise.all([
    fetchText('/style.css'),
    fetchText('/vendor/mermaid.min.js'),
    fetchText('/service-icons.js'),
    fetchText('/viewer.config.js'),
    fetchText('/app.js'),
  ]);
  const doc = document.documentElement.cloneNode(true);
  doc.classList.add('is-exported');
  doc.querySelectorAll('script').forEach((script) => script.remove());
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.remove());
  const mount = doc.querySelector('#diagramMount');
  if (mount) {
    mount.replaceChildren();
  }
  const navList = doc.querySelector('#diagramNavList');
  if (navList) {
    navList.replaceChildren();
  }

  const head = doc.querySelector('head');
  const style = document.createElement('style');
  style.textContent = css;
  head.append(style);

  const body = doc.querySelector('body');
  const scripts = [
    mermaidSource,
    iconsSource,
    configSource,
    `window.FLOW_VIEWER_EMBEDDED_DIAGRAMS = ${JSON.stringify(state.diagrams).replace(/</g, '\\u003c')};`,
  ];
  scripts.forEach((source) => {
    const script = document.createElement('script');
    script.textContent = source;
    body.append(script);
  });
  const appScript = document.createElement('script');
  appScript.type = 'module';
  appScript.textContent = appSource;
  body.append(appScript);

  let html = `<!doctype html>\n${doc.outerHTML}`;
  // textContent 직렬화 후 </script 문자열이 남지 않도록 다시 한 번 막는다.
  html = html.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/g, (all, open, inner, close) => (
    `${open}${escapeInlineScript(inner)}${close}`
  ));
  return html;
}

window.FLOW_VIEWER_BUILD_STANDALONE = buildStandaloneHtml;

if (exportButton) {
  exportButton.addEventListener('click', async () => {
    const original = exportButton.textContent;
    exportButton.disabled = true;
    exportButton.textContent = '내보내는 중';
    try {
      const html = await buildStandaloneHtml();
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(UI.title || 'flow').replace(/[\\/:*?"<>|\s]+/g, '-')}.html`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDataStatus(`내보내기 실패: ${error instanceof Error ? error.message : error}`, true);
    } finally {
      exportButton.disabled = false;
      exportButton.textContent = original;
    }
  });
}
if (window.FLOW_VIEWER_EMBEDDED_DIAGRAMS && exportButton) {
  exportButton.hidden = true;
}

// Mermaid themeVariables는 oklch/hex 파서가 제한적이라 sRGB hex만 사용한다.
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  flowchart: {
    // 기본은 Mermaid 원래 곡선과 라벨 위치를 사용한다. 직각 선은 명시적으로 선택한다.
    curve: EDGES_CONFIG.curve || 'basis',
    padding: 22,
    nodeSpacing: 48,
    rankSpacing: 56,
    htmlLabels: true,
  },
  themeVariables: {
    fontFamily: '"Inter", -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
    fontSize: '13px',
    // 노드는 테마와 무관하게 흰색 고정(다크 테마에서는 바깥 면만 바뀐다).
    primaryColor: '#ffffff',
    primaryTextColor: '#0d0d0f',
    primaryBorderColor: '#c8cdd3',
    lineColor: '#b0b4ba',
    secondaryColor: '#f4f5f7',
    tertiaryColor: '#fbfbfc',
    mainBkg: '#ffffff',
    nodeBorder: '#c8cdd3',
    clusterBkg: '#f0f6fd',
    clusterBorder: '#8fb6ec',
    titleColor: '#0d0d0f',
    edgeLabelBackground: '#ffffff',
  },
});

applyUiConfig();
loadDiagrams();
