/* 명시적 서비스 분류를 읽고 아이콘·묶음에 같은 값을 사용한다. 브라우저/Node 공용. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FLOW_VIEWER_DIAGRAM_SERVICES = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const SERVICE_TITLES = {
    monday: 'Monday', 'apps-script': 'Apps Script', sheets: 'Google Sheets',
    'google-chat': 'Google Chat', drive: 'Google Drive', gmail: 'Gmail',
    calendar: 'Google Calendar', github: 'GitHub', slack: 'Slack',
    webhook: 'Webhook', database: 'Database', browser: '웹 화면', openai: 'OpenAI API',
    terminal: '터미널', nas: 'NAS', illustrator: 'Adobe Illustrator', agent: '업무 에이전트',
    none: '기타',
  };

  const SHAPES = [
    ['([', '])'], ['[(', ')]'], ['[[', ']]'], ['((', '))'], ['{{', '}}'],
    ['[', ']'], ['{', '}'], ['(', ')'],
  ];

  function readServices(code) {
    const services = new Map();
    for (const line of String(code).split('\n')) {
      const match = line.match(/^\s*class\s+([A-Za-z][A-Za-z0-9_,\s-]*)\s+svc_([a-z0-9_]+)\s*;?\s*$/);
      if (!match) continue;
      const service = match[2].replace(/_/g, '-');
      for (const id of match[1].split(',').map((id) => id.trim())) {
        if (services.has(id) && services.get(id) !== service) {
          throw new Error(`${id}: 대상 서비스가 두 개 지정되어 있습니다.`);
        }
        services.set(id, service);
      }
    }
    return services;
  }

  /** 라벨 안의 HTML/괄호는 그대로 두고 노드 ID와 도형 구분자만 읽는다. */
  function nodeDefinitions(code) {
    const nodes = [];
    let offset = 0;
    for (const line of String(code).split('\n')) {
      if (!/^\s*(?:%%|subgraph\b|class(?:Def)?\b|style\b|click\b)/.test(line)) {
        const pattern = /\b([A-Za-z][A-Za-z0-9_-]*)(\(\[|\[\(|\[\[|\(\(|\{\{|\[|\{|\()/g;
        let match;
        while ((match = pattern.exec(line))) {
          const shape = SHAPES.find(([open]) => open === match[2]);
          const start = pattern.lastIndex;
          const quoted = line[start] === '"';
          let end = quoted ? start + 1 : start;
          if (quoted) {
            while (end < line.length && (line[end] !== '"' || line[end - 1] === '\\')) end++;
            if (line.slice(end + 1, end + 1 + shape[1].length) !== shape[1]) continue;
          } else {
            end = line.indexOf(shape[1], start);
            if (end < 0) continue;
          }
          const finish = end + shape[1].length + (quoted ? 1 : 0);
          nodes.push({ id: match[1], open: shape[0], close: shape[1],
            label: line.slice(start + (quoted ? 1 : 0), end),
            start: offset + match.index, end: offset + finish });
          pattern.lastIndex = finish;
        }
      }
      offset += line.length + 1;
    }
    return nodes;
  }

  function annotateNodes(code, annotate) {
    const source = String(code);
    let result = source;
    for (const node of nodeDefinitions(source).reverse()) {
      const label = annotate(node);
      if (label === null || label === undefined) continue;
      const safe = label.replace(/"/g, '#quot;');
      result = result.slice(0, node.start) + `${node.id}${node.open}"${safe}"${node.close}` + result.slice(node.end);
    }
    return result;
  }

  function addGroups(code, services, titles = SERVICE_TITLES) {
    if (services.size === 0 || /^\s*subgraph\b/m.test(code)) return { code, groups: new Map() };
    const byService = new Map();
    for (const [id, service] of services) {
      if (service === 'none') continue;
      if (!byService.has(service)) byService.set(service, []);
      byService.get(service).push(id);
    }
    const groups = new Map();
    const used = new Set(nodeDefinitions(code).map((node) => node.id));
    const lines = [];
    for (const [service, ids] of byService) {
      let groupId = `SVC_GROUP_${service.replace(/-/g, '_')}`;
      while (used.has(groupId)) groupId += '_';
      used.add(groupId);
      groups.set(groupId, service);
      const title = String(titles[service] || service).replace(/[<>"\[\]\r\n]/g, ' ');
      lines.push(`  subgraph ${groupId}["${title}"]`, ...ids.map((id) => `    ${id}`), '  end');
    }
    return { code: `${String(code).trimEnd()}\n${lines.join('\n')}\n`, groups };
  }

  function validateServices(code, services, titles = SERVICE_TITLES) {
    const ids = new Set(nodeDefinitions(code).map((node) => node.id));
    for (const [id, service] of services) {
      if (!ids.has(id)) throw new Error(`${id}: 서비스 분류에 대응하는 노드 정의가 없습니다.`);
      if (!Object.hasOwn(titles, service)) throw new Error(`${id}: 알 수 없는 서비스 ${service}`);
    }
  }

  return { SERVICE_TITLES, readServices, nodeDefinitions, annotateNodes, addGroups, validateServices };
});
