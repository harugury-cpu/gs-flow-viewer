const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 4747;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SOURCE_MARKDOWN_PATH = process.env.DIAGRAM_SOURCE
  ? path.resolve(process.env.DIAGRAM_SOURCE)
  : path.join(__dirname, 'diagrams.md');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function extractFileName(title) {
  const lastPathSegment = title.split('/').pop().trim();
  return lastPathSegment.replace(/\s+\(legacy\)\s*$/i, '').trim();
}

function parseDiagrams(markdown) {
  const sectionPattern = /^## ([^\r\n]+)\r?\n(?:\r?\n)*```mermaid\r?\n([\s\S]*?)(?:\r?\n)?```/gm;
  const diagrams = [];
  let match;

  // fileName이 여러 폴더(파일이 여러 시트/프로젝트에 복사되는 경우)에서 겹칠 수 있으므로
  // title(전체 경로) 기준으로만 유지하고 fileName으로는 중복 제거하지 않는다.
  while ((match = sectionPattern.exec(markdown)) !== null) {
    const heading = match[1];
    const separatorIndex = heading.indexOf(' | ');
    const title = separatorIndex === -1 ? heading : heading.slice(0, separatorIndex).trim();
    const fileName = extractFileName(title);
    const displayName = separatorIndex === -1
      ? fileName
      : heading.slice(separatorIndex + 3).trim();

    diagrams.push({
      id: diagrams.length === 0 ? 'overview' : `diagram-${diagrams.length}`,
      title,
      fileName,
      displayName,
      mermaidCode: match[2],
    });
  }

  return diagrams;
}

function readDiagrams() {
  const markdown = fs.readFileSync(SOURCE_MARKDOWN_PATH, 'utf8');
  return parseDiagrams(markdown);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function getSafePublicPath(requestPath) {
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const absolutePath = path.resolve(PUBLIC_DIR, relativePath);

  if (absolutePath !== PUBLIC_DIR && !absolutePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    return null;
  }

  return absolutePath;
}

function createServer() {
  return http.createServer((request, response) => {
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' });
      response.end('Method Not Allowed');
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/diagrams.json') {
      try {
        sendJson(response, 200, readDiagrams());
      } catch (error) {
        sendJson(response, 500, { error: '다이어그램 원본을 읽거나 파싱하지 못했습니다.' });
      }
      return;
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Bad Request');
      return;
    }

    const filePath = getSafePublicPath(decodedPath);
    if (!filePath) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, file) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
          'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end(error.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
        return;
      }

      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      response.end(file);
    });
  });
}

if (require.main === module) {
  createServer().listen(PORT, '127.0.0.1', () => {
    console.log(`Monday GAS flow viewer listening at http://localhost:${PORT}`);
  });
}

module.exports = {
  PORT,
  SOURCE_MARKDOWN_PATH,
  createServer,
  extractFileName,
  parseDiagrams,
};
