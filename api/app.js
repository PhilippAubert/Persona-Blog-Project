import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath, parse
} from "url";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const PUBLIC_DIR = path.join(DIRNAME, "../public");

const port = 3000;

const server = http.createServer((req, res) => {

    const cleanPath = parse(req.url).pathname;
    const filePath = path.join(PUBLIC_DIR, cleanPath === "/" ? "index.html" : cleanPath);
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
