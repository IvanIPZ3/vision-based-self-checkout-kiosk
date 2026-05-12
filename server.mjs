import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexFilePath = path.join(distDir, 'index.html');
const port = Number.parseInt(process.env.PORT ?? '8080', 10);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const sendFile = async (response, filePath) => {
  try {
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] ?? 'application/octet-stream';

    response.writeHead(200, {
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Length': fileStats.size,
      'Content-Type': contentType,
    });

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
};

const resolveRequestPath = (requestUrl = '/') => {
  const normalizedPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const cleanedPath = normalizedPath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(distDir, cleanedPath);
  const isInsideDist = resolvedPath === distDir || resolvedPath.startsWith(`${distDir}${path.sep}`);

  if (!isInsideDist) {
    return null;
  }

  return normalizedPath === '/' ? indexFilePath : resolvedPath;
};

const server = createServer(async (request, response) => {
  const requestMethod = request.method ?? 'GET';

  if (!['GET', 'HEAD'].includes(requestMethod)) {
    response.writeHead(405, { 'Allow': 'GET, HEAD' });
    response.end();
    return;
  }

  const resolvedPath = resolveRequestPath(request.url);

  if (!resolvedPath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  const requestedExtension = path.extname(resolvedPath).toLowerCase();
  const hasRequestedStaticAsset = requestedExtension.length > 0;
  const fileExists = existsSync(resolvedPath);

  if (fileExists) {
    if (requestMethod === 'HEAD') {
      try {
        const fileStats = await stat(resolvedPath);
        const contentType = contentTypes[requestedExtension] ?? 'application/octet-stream';
        response.writeHead(200, {
          'Cache-Control': requestedExtension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
          'Content-Length': fileStats.size,
          'Content-Type': contentType,
        });
        response.end();
        return;
      } catch {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Internal server error');
        return;
      }
    }

    await sendFile(response, resolvedPath);
    return;
  }

  if (hasRequestedStaticAsset) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  if (requestMethod === 'HEAD') {
    try {
      const fileStats = await stat(indexFilePath);
      response.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Length': fileStats.size,
        'Content-Type': 'text/html; charset=utf-8',
      });
      response.end();
      return;
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal server error');
      return;
    }
  }

  await sendFile(response, indexFilePath);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server is listening on port ${port}`);
});
