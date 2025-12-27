import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3000;
const publicDir = path.join(__dirname, "../public");

const server = http.createServer((req, res) => {

  const filePath = path.join(publicDir, req.url === "/" ? "index.html" : req.url);

  const ext = path.extname(filePath);

  const contentType = ext === ".css" ? "text/css" : "text/html";

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("File not found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

server.listen(port, () => console.log("Server running on port", port));
