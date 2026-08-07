const state = {
  diagrams: [],
  activeId: null,
  renderSequence: 0,
  activeBoardId: null,
};

const elements = {
  backButton: document.querySelector('#backButton'),
  dataStatus: document.querySelector('#dataStatus'),
  diagramError: document.querySelector('#diagramError'),
  diagramHint: document.querySelector('#diagramHint'),
  diagramKicker: document.querySelector('#diagramKicker'),
  diagramMount: document.querySelector('#diagramMount'),
  diagramNavList: document.querySelector('#diagramNavList'),
  diagramPath: document.querySelector('#diagramPath'),
  diagramStatus: document.querySelector('#diagramStatus'),
  diagramTitle: document.querySelector('#diagramTitle'),
  legendList: document.querySelector('#legendList'),
  navClearFilter: document.querySelector('#navClearFilter'),
  navFilterCount: document.querySelector('#navFilterCount'),
  navFilterLabel: document.querySelector('#navFilterLabel'),
  navToolbar: document.querySelector('#navToolbar'),
  overviewLegend: document.querySelector('#overviewLegend'),
  relatedBoardList: document.querySelector('#relatedBoardList'),
  relatedBoardsSection: document.querySelector('#relatedBoardsSection'),
  sidebar: document.querySelector('.sidebar'),
  titleBlockFile: document.querySelector('#titleBlockFile'),
  titleBlockNodes: document.querySelector('#titleBlockNodes'),
  titleBlockBoard: document.querySelector('#titleBlockBoard'),
  titleBlockStatus: document.querySelector('#titleBlockStatus'),
};

const mermaid = window.mermaid;

/** 보드 색상/필터 설정은 public/boards.config.js(선택 사항)에서 온다. 비어 있으면 관련 UI는 자동 숨김. */
const boardsConfig = window.BOARDS_CONFIG || {};
const BOARDS = boardsConfig.boards || {};
const BOARD_ALIASES = boardsConfig.boardAliases || [];
const FILE_BOARD_MAP = boardsConfig.fileBoardMap || {};
const HAS_BOARDS = Object.keys(BOARDS).length > 0;

const GROUP_ORDER = [
  '전체',
  'API 시트',
  '공용 시트',
  '1파트 시트',
  '패키지 정량화 시트',
  '기타',
];

function getOverview() {
  return state.diagrams.find((diagram) => diagram.title === '전체 구조') || state.diagrams[0];
}

function getDetailByFileName(fileName) {
  return state.diagrams.find((diagram) => diagram.fileName === fileName && diagram.title !== '전체 구조');
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

function getBoardsForDiagram(diagram) {
  if (!diagram || diagram.title === '전체 구조') {
    return Object.values(BOARDS).filter((board) => board.webhook);
  }
  const ids = FILE_BOARD_MAP[cleanFileName(diagram.fileName)] || [];
  return ids.map((id) => BOARDS[id]).filter(Boolean);
}

function primaryBoard(diagram) {
  const boards = getBoardsForDiagram(diagram);
  return boards.find((board) => board.webhook) || boards[0] || null;
}

function isOverviewDiagram(diagram) {
  return Boolean(diagram && (diagram.id === 'overview' || diagram.title === '전체 구조'));
}

function diagramMatchesBoard(diagram, boardId) {
  if (!boardId) {
    return true;
  }
  // 보드 필터 중에는 전체 구조를 결과에 넣지 않는다. 상세 파일만 좁혀 보여 준다.
  if (isOverviewDiagram(diagram)) {
    return false;
  }
  return getBoardsForDiagram(diagram).some((board) => board.id === boardId);
}

function getFilteredDiagrams(boardId = state.activeBoardId) {
  if (!boardId) {
    return state.diagrams.slice();
  }
  return state.diagrams.filter((diagram) => diagramMatchesBoard(diagram, boardId));
}

function getFirstFilteredDetail(boardId = state.activeBoardId) {
  return getFilteredDiagrams(boardId).find((diagram) => !isOverviewDiagram(diagram)) || null;
}

function setDataStatus(message, isError = false) {
  elements.dataStatus.textContent = message;
  elements.dataStatus.classList.toggle('is-error', isError);
}

function createChip(board, { compact = false, active = false, onClick } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `chip${board.webhook ? ' is-webhook' : ''}${active ? ' is-active' : ''}`;
  button.style.setProperty('--chip-color', board.color);
  button.dataset.boardId = board.id;
  button.setAttribute('role', 'listitem');
  button.title = `${board.mondayName}${board.boardId ? ` · ${board.boardId}` : ''}${board.webhook ? ` · 웹훅: ${board.webhookNote || '발생 보드'}` : ''}`;

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
  name.textContent = board.name;
  nameRow.append(name);

  if (board.webhook) {
    const badge = document.createElement('span');
    badge.className = 'chip__webhook-badge';
    badge.textContent = 'WEBHOOK';
    nameRow.append(badge);
  }
  body.append(nameRow);

  if (!compact) {
    const meta = document.createElement('span');
    meta.className = 'chip__meta';
    meta.textContent = board.webhook
      ? `웹훅 · ${board.webhookNote || board.boardId}`
      : board.boardId || '연동 보드';
    body.append(meta);
  }

  button.append(body);

  if (typeof onClick === 'function') {
    button.addEventListener('click', () => onClick(board));
  }

  return button;
}

function renderLegend() {
  const fragment = document.createDocumentFragment();
  Object.values(BOARDS).forEach((board) => {
    fragment.append(
      createChip(board, {
        compact: true,
        active: state.activeBoardId === board.id,
        onClick: (selected) => setBoardFilter(selected.id === state.activeBoardId ? null : selected.id),
      }),
    );
  });
  elements.legendList.replaceChildren(fragment);
}

function createNavButton(diagram, isOverview) {
  const button = document.createElement('button');
  const board = primaryBoard(diagram);
  button.type = 'button';
  button.className = `nav-item${isOverview ? ' nav-item--overview' : ''}`;
  button.dataset.diagramId = diagram.id;
  button.title = diagram.title;
  button.style.setProperty('--item-color', board ? board.color : 'oklch(0.7 0.05 210)');
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
    const path = document.createElement('span');
    path.className = 'nav-item__path';
    path.textContent = diagram.title.includes('/')
      ? diagram.title.slice(0, diagram.title.lastIndexOf('/'))
      : '';
    content.append(path);

    const badges = document.createElement('span');
    badges.className = 'nav-item__badges';
    const boards = getBoardsForDiagram(diagram);
    if (boards.some((item) => item.webhook)) {
      const webhookBadge = document.createElement('span');
      webhookBadge.className = 'mini-badge mini-badge--webhook';
      webhookBadge.textContent = 'WEBHOOK';
      badges.append(webhookBadge);
    }
    boards.slice(0, 3).forEach((item) => {
      const badge = document.createElement('span');
      badge.className = 'mini-badge';
      badge.style.setProperty('--badge-color', item.color);
      const dot = document.createElement('span');
      dot.className = 'mini-badge__dot';
      badge.append(dot, document.createTextNode(item.name.replace(' 패키지 현황', '').replace(' 패키지', '')));
      badges.append(badge);
    });
    if (badges.childNodes.length > 0) {
      content.append(badges);
    }
  }

  button.append(content);
  button.addEventListener('click', () => showDiagram(diagram.id));
  return button;
}

function createNavEmptyState(board) {
  const empty = document.createElement('div');
  empty.className = 'nav-empty';
  empty.setAttribute('role', 'status');

  const title = document.createElement('strong');
  title.textContent = board ? `${board.name} 연결 파일 없음` : '표시할 파일이 없습니다';

  const body = document.createElement('p');
  body.textContent = '필터를 해제하거나 다른 보드를 선택하세요.';

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'text-button text-button--on-dark';
  action.textContent = '필터 해제';
  action.addEventListener('click', () => setBoardFilter(null));

  empty.append(title, body, action);
  return empty;
}

function updateNavToolbar(matchCount) {
  const filtering = Boolean(state.activeBoardId);
  const board = state.activeBoardId ? BOARDS[state.activeBoardId] : null;

  if (elements.sidebar) {
    elements.sidebar.classList.toggle('is-filtering', filtering);
  }
  if (elements.navToolbar) {
    elements.navToolbar.hidden = !filtering;
  }
  if (!filtering || !board) {
    return;
  }

  if (elements.navFilterLabel) {
    elements.navFilterLabel.textContent = board.name;
  }
  if (elements.navFilterCount) {
    elements.navFilterCount.textContent = `${matchCount}개 파일`;
  }
  if (elements.navToolbar) {
    elements.navToolbar.style.setProperty('--filter-color', board.color);
  }
}

function renderNavigation() {
  const overview = getOverview();
  const filtering = Boolean(state.activeBoardId);
  const details = state.diagrams
    .filter((diagram) => !isOverviewDiagram(diagram))
    .filter((diagram) => diagramMatchesBoard(diagram, state.activeBoardId));
  const fragment = document.createDocumentFragment();

  updateNavToolbar(details.length);

  // 필터 없을 때만 전체 구조를 맨 위에 둔다.
  if (!filtering && overview) {
    fragment.append(createNavButton(overview, true));
  }

  if (filtering && details.length === 0) {
    fragment.append(createNavEmptyState(BOARDS[state.activeBoardId]));
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
  if (!state.activeBoardId) {
    return;
  }
  if (active && diagramMatchesBoard(active, state.activeBoardId)) {
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

function setBoardFilter(boardId) {
  state.activeBoardId = boardId;
  renderLegend();
  renderNavigation();
  updateNavigationState();
  ensureActiveMatchesFilter();

  const active = state.diagrams.find((diagram) => diagram.id === state.activeId);
  if (active) {
    renderRelatedBoards(active);
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

function buildInteractiveOverviewCode(code) {
  const clickLines = [];
  const nodeMap = getInteractiveNodeMap(code);
  nodeMap.forEach((fileName, nodeId) => {
    clickLines.push(`click ${nodeId} call onNodeClick(${JSON.stringify(fileName)})`);
  });
  return clickLines.length > 0 ? `${code.trimEnd()}\n\n${clickLines.join('\n')}` : code;
}

function resolveBoardFromLabel(label) {
  const normalized = String(label || '').toLowerCase();
  for (const alias of BOARD_ALIASES) {
    if (alias.keys.some((key) => normalized.includes(key))) {
      return BOARDS[alias.board];
    }
  }

  const fileName = cleanFileName(label);
  const boards = FILE_BOARD_MAP[fileName];
  if (boards && boards.length > 0) {
    return BOARDS[boards[0]];
  }
  return null;
}

function bindAccessibleNodes(nodeMap) {
  const nodes = [...elements.diagramMount.querySelectorAll('.node')];
  nodeMap.forEach((fileName, nodeId) => {
    const node = nodes.find((item) => item.id.startsWith(`flowchart-${nodeId}-`));
    if (!node) {
      return;
    }
    node.classList.add('is-drilldown');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${fileName} 상세 흐름 열기`);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.onNodeClick(fileName);
      }
    });
  });
}

function colorizeRenderedNodes(code) {
  const labels = parseNodeLabels(code);
  const nodes = [...elements.diagramMount.querySelectorAll('.node')];

  labels.forEach((label, nodeId) => {
    const node = nodes.find((item) => item.id.startsWith(`flowchart-${nodeId}-`));
    if (!node) {
      return;
    }
    if (nodeId === 'WHSRC' || /^웹훅 발생/.test(label)) {
      node.classList.add('is-webhook-source');
      return;
    }
    const board = resolveBoardFromLabel(label);
    if (!board) {
      return;
    }
    node.classList.add('is-board-colored');
    if (board.webhook) {
      node.classList.add('is-webhook-board');
    }
    node.style.setProperty('--node-fill', board.soft);
    node.style.setProperty('--node-stroke', board.color);
    if (state.activeBoardId && board.id !== state.activeBoardId) {
      node.style.opacity = '0.42';
    } else {
      node.style.opacity = '1';
    }
  });
}

function getWebhookSourceBoards(diagram) {
  if (!diagram || isOverviewDiagram(diagram)) {
    return [];
  }
  return getBoardsForDiagram(diagram).filter((board) => board.webhook);
}

/** 상세 차트 상단에 웹훅 알림과 발생 보드명을 mermaid 노드로 주입한다. */
function withWebhookSourceAnnotation(code, diagram) {
  const webhookBoards = getWebhookSourceBoards(diagram);
  if (webhookBoards.length === 0) {
    return code;
  }

  const names = webhookBoards.map((board) => board.name).join(' · ');
  const noteLabel = `- ${names}`;
  const annotation = [
    '  WHSRC(["먼데이 변경 알림"])',
    `  WHSRC_NOTE["${noteLabel}"]`,
    '  classDef whsrc fill:#FBFBFC,stroke:#1D7BD6,color:#0D0D0F,stroke-width:1.6px',
    '  classDef whsrcNote fill:transparent,stroke:transparent,color:#6B6B70,stroke-width:0px',
    '  class WHSRC whsrc',
    '  class WHSRC_NOTE whsrcNote',
  ].join('\n');

  // 이미 주입된 코드면 중복 추가하지 않는다.
  if (/\bWHSRC\b/.test(code) || code.includes('먼데이 변경 알림')) {
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

function renderRelatedBoards(diagram) {
  if (!HAS_BOARDS) {
    elements.overviewLegend.hidden = true;
    elements.relatedBoardsSection.hidden = true;
    return;
  }

  const isOverview = diagram === getOverview();
  elements.overviewLegend.hidden = !isOverview;
  elements.relatedBoardsSection.hidden = isOverview;

  if (isOverview) {
    renderLegend();
    return;
  }

  const boards = getBoardsForDiagram(diagram);
  const fragment = document.createDocumentFragment();
  if (boards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diagram-path';
    empty.textContent = '이 파일은 특정 Monday 보드보다 공통 유틸/시트 처리에 가깝습니다.';
    fragment.append(empty);
  } else {
    boards.forEach((board) => {
      fragment.append(
        createChip(board, {
          compact: true,
          active: state.activeBoardId === board.id,
          onClick: (selected) => setBoardFilter(selected.id === state.activeBoardId ? null : selected.id),
        }),
      );
    });
  }
  elements.relatedBoardList.replaceChildren(fragment);
}

function setTitleBlock({ file, nodes, board, status }) {
  if (elements.titleBlockFile && file !== undefined) {
    elements.titleBlockFile.textContent = file;
  }
  if (elements.titleBlockNodes && nodes !== undefined) {
    elements.titleBlockNodes.textContent = nodes;
  }
  if (elements.titleBlockBoard && board !== undefined) {
    elements.titleBlockBoard.textContent = board;
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
    : withWebhookSourceAnnotation(diagram.mermaidCode, diagram);
  const source = isOverview ? buildInteractiveOverviewCode(annotatedCode) : annotatedCode;
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
    elements.diagramStatus.textContent = '렌더링 완료';
    const webhookBoards = getWebhookSourceBoards(diagram);
    elements.diagramHint.textContent = isOverview
      ? '색이 있는 노드는 보드/파일 성격 · 파일 노드 클릭 시 상세'
        : webhookBoards.length > 0
        ? `먼데이 변경 알림 - ${webhookBoards.map((board) => board.name).join(' · ')}`
        : '이 흐름의 보드 칩으로 필터하거나 사이드바에서 다른 파일로 이동';

    const board = primaryBoard(diagram);
    const nodeCount = elements.diagramMount.querySelectorAll('.node').length;
    setTitleBlock({
      nodes: nodeCount,
      board: board ? board.name : '—',
      status: 'RENDERED',
    });
  } catch (error) {
    if (renderSequence === state.renderSequence && diagram.id === state.activeId) {
      showRenderError(error);
      setTitleBlock({ status: 'ERROR' });
    }
  }
}

async function showDiagram(diagramId) {
  const diagram = state.diagrams.find((item) => item.id === diagramId);
  if (!diagram) {
    return;
  }

  state.activeId = diagram.id;
  updateNavigationState();

  const isOverview = diagram === getOverview();
  elements.backButton.hidden = isOverview;
  elements.diagramKicker.textContent = isOverview ? '전체 구조' : getGroupName(diagram);
  elements.diagramTitle.textContent = isOverview ? 'Monday GAS 자동화 전체 구조' : diagram.fileName;
  elements.diagramPath.textContent = isOverview
    ? '웹훅 보드 → 알림/싱크/정량화/시트 동기화 연결'
    : diagram.title;

  renderRelatedBoards(diagram);
  setTitleBlock({ file: isOverview ? '전체 구조' : diagram.fileName });
  await renderDiagram(diagram);
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
    setDataStatus(`${state.diagrams.length}개 다이어그램 · 보드 ${Object.keys(BOARDS).length}개`);
    await showDiagram(getOverview().id);
  } catch (error) {
    showLoadError(error);
  }
}

window.onNodeClick = (fileName) => {
  const detail = getDetailByFileName(cleanFileName(fileName));
  if (detail) {
    showDiagram(detail.id);
  }
};

elements.backButton.addEventListener('click', () => {
  // 필터 중 전체 구조로 돌아갈 때는 필터도 함께 풀어 목록이 다시 열리게 한다.
  if (state.activeBoardId) {
    setBoardFilter(null);
  }
  showDiagram(getOverview().id);
});
if (elements.navClearFilter) {
  elements.navClearFilter.addEventListener('click', () => setBoardFilter(null));
}

// Mermaid themeVariables는 oklch/hex 파서가 제한적이라 sRGB hex만 사용한다.
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
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

loadDiagrams();
