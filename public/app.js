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
  const annotatedCode = isOverview
    ? diagram.mermaidCode
    : withFeaturedSourceAnnotation(diagram.mermaidCode, diagram);
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
    addFlowAnimation(diagram, annotatedCode);
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

async function loadDiagrams() {
  try {
    const response = await fetch('/diagrams.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.diagrams = await response.json();
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

// Mermaid themeVariables는 oklch/hex 파서가 제한적이라 sRGB hex만 사용한다.
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  flowchart: {
    curve: 'basis',
    padding: 22,
    nodeSpacing: 48,
    rankSpacing: 56,
    htmlLabels: true,
  },
  themeVariables: {
    fontFamily: '"Inter", -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
    fontSize: '13px',
    primaryColor: '#eef2f6',
    primaryTextColor: '#0d0d0f',
    primaryBorderColor: '#c8cdd3',
    lineColor: '#b0b4ba',
    secondaryColor: '#f4f5f7',
    tertiaryColor: '#fbfbfc',
    mainBkg: '#f4f5f7',
    nodeBorder: '#c8cdd3',
    clusterBkg: '#f4f5f7',
    titleColor: '#0d0d0f',
    edgeLabelBackground: '#f4f5f7',
  },
});

applyUiConfig();
loadDiagrams();
