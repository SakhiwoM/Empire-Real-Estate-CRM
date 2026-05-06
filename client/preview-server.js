const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const host = process.env.PREVIEW_HOST || "127.0.0.1";
const port = Number(process.env.PREVIEW_PORT || 5173);
const distDir = path.join(__dirname, "dist");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  fs.createReadStream(filePath).pipe(res);
}

function resolveFilePath(urlPath) {
  const normalized = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const fullPath = path.resolve(distDir, normalized);

  // Prevent path traversal outside dist.
  if (!fullPath.startsWith(distDir)) {
    return null;
  }
  return fullPath;
}

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Client build not found. Run: npm run build (inside client/) first.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${host}:${port}`);
  const requestedPath = resolveFilePath(requestUrl.pathname);

  if (!requestedPath) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  const tryPaths = [requestedPath];
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
    tryPaths.push(path.join(requestedPath, "index.html"));
  }

  const existingFile = tryPaths.find((filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile());
  if (existingFile) {
    sendFile(res, existingFile);
    return;
  }

  // SPA fallback
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(port, host, () => {
  console.log(`Empire Property CRM frontend preview running at http://${host}:${port}`);
});
