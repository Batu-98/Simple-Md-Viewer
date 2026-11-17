/**
 * Simple Markdown Viewer & PDF - Local Server (server.js)
 * Zero dependencies (no npm install required). Runs with Node.js built-in modules.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const HOST = '127.0.0.1';
const APP_DIR = __dirname;
const initialFile = (process.argv[2] && process.argv[2] !== '--no-open') ? path.resolve(process.argv[2]) : null;

// Server log file (server.log)
const logFile = path.join(APP_DIR, 'server.log');
function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toLocaleTimeString()}] ${msg}\r\n`);
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err ? (err.stack || err) : 'unknown'}`);
});
process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`);
});
process.on('exit', (code) => {
  log(`PROCESS EXIT WITH CODE: ${code}`);
});

log(`=== Server.js Started (PID: ${process.pid}, Args: ${process.argv.slice(2).join(' ')}) ===`);

// MIME Types Dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.markdown': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Scan markdown files recursively (up to 3 levels deep)
function scanMarkdownFiles(dir, baseDir = dir, depth = 0) {
  let results = [];
  if (depth > 3) return results;

  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;

      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        results = results.concat(scanMarkdownFiles(fullPath, baseDir, depth + 1));
      } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
        results.push({
          name: item.name,
          path: relativePath,
          size: fs.statSync(fullPath).size
        });
      }
    }
  } catch (err) {
    console.error('Directory scan error:', err.message);
  }

  return results;
}

function openBrowser(targetFile) {
  let targetUrl = `http://${HOST}:${PORT}/`;
  if (targetFile) {
    targetUrl += `?file=${encodeURIComponent(targetFile)}`;
  }
  const startCmd = process.platform === 'win32' ? `start "" "${targetUrl}"` :
                   process.platform === 'darwin' ? `open "${targetUrl}"` : `xdg-open "${targetUrl}"`;
  exec(startCmd);
}

function startServer() {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API 0: Ping (Health check)
    if (pathname === '/api/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', port: PORT }));
      return;
    }

    // API 1: List Workspace Markdown Files
    if (pathname === '/api/list-files' && req.method === 'GET') {
      const files = scanMarkdownFiles(APP_DIR);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ files }));
      return;
    }

    // API 2: Read Specified Markdown File
    if (pathname === '/api/read-file' && req.method === 'GET') {
      const targetFile = parsedUrl.searchParams.get('path');
      if (!targetFile) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error: path parameter is required.');
        return;
      }

      const fullPath = path.isAbsolute(targetFile) ? path.normalize(targetFile) : path.resolve(APP_DIR, targetFile);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('File not found: ' + fullPath);
      }
      return;
    }

    // API 3: Save Markdown File
    if (pathname === '/api/save-file' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.path || data.content === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid data' }));
            return;
          }

          const fullPath = path.isAbsolute(data.path) ? path.normalize(data.path) : path.resolve(APP_DIR, data.path);
          fs.writeFileSync(fullPath, data.content, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Static Assets Server
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(APP_DIR, decodeURIComponent(filePath));

    if (!filePath.startsWith(APP_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Access denied.');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - Page Not Found</h1><p><a href="/">Back to Home</a></p>');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  server.listen(PORT, HOST, () => {
    console.log('\n======================================================');
    console.log('   📄 Simple Markdown Viewer & PDF Ready!');
    console.log(`   🌐 Address: http://${HOST}:${PORT}`);
    console.log(`   📂 Application Directory: ${APP_DIR}`);
    if (initialFile && initialFile !== '--no-open') {
      console.log(`   📄 Active File: ${initialFile}`);
    }
    console.log('======================================================\n');
    if (!process.argv.includes('--no-open')) {
      console.log('Opening default browser...');
      openBrowser(initialFile);
    }
  });
}

// Entrypoint: Check if server is already running, open tab or launch server
async function init() {
  if (!process.argv.includes('--no-open')) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/api/ping`, { signal: AbortSignal.timeout(800) });
      if (res.ok) {
        console.log('Server is already running, opening new browser tab...');
        openBrowser(initialFile);
        setTimeout(() => process.exit(0), 1000);
        return;
      }
    } catch (e) {
      // Server not running, launch new instance
    }
  }

  startServer();
}

init();
