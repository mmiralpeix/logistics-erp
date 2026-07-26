const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const htmlPath = path.join(__dirname, 'GRAPH_TREE.html');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  fs.readFile(htmlPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('GRAPH_TREE.html no encontrado.');
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Graphify Neural Map servidor activo en http://localhost:${PORT}`);
});
