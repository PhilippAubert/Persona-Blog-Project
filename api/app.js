import ejs from "ejs";

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath, parse
} from "url";


const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const PUBLIC_DIR = path.join(DIRNAME, "public");
const VIEWS_DIR = path.join(DIRNAME, "views");

const port = 3000;

const server = http.createServer((req, res) => {

    const cleanPath = parse(req.url).pathname;
    
    if (cleanPath.startsWith("/styles")) {
        const filePath = path.join(PUBLIC_DIR, cleanPath);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end();
            } else {
                res.writeHead(200, { "Content-Type": "text/css" });
                res.end(data);
            }
        });
        return;
    }
    
    if (cleanPath.startsWith("/")) {
        const data = {
            title: "A PERSONAL BLOG",
            year: new Date().getFullYear(),
            articles: [
                { id: 1, title: "My article", date: "December 26, 2025" },
                { id: 2, title: "Another article", date: "December 27, 2025" },
                { id: 3, title: "Third article", date: "December 28, 2025" }
            ]
        };

        ejs.renderFile(
            path.join(VIEWS_DIR, "index.ejs"),
            data,
            (err, html) => {
                if (err) {
                    res.writeHead(500);
                    res.end("Error rendering template");
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(html);
                }
            }
        );
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");

});

server.listen(port, () => console.log("Server running on port", port));
