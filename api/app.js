import ejs from "ejs";
import dotenv from "dotenv";

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath, parse
} from "url";

import pageMap from "./config/pageMap.js";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const PUBLIC_DIR = path.join(DIRNAME, "../public");
const VIEWS_DIR = path.join(DIRNAME, "../views");

dotenv.config();

const port = process.env.PORT || 4400;

const server = http.createServer((req, res) => {

    //SUPER-BIZARRE! TOO MUCH PATH STUFF! 
    const cleanPath = parse(req.url).pathname;
    
    // CSSLOADER! REFACTOR!
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
    
    const template = pageMap[cleanPath];

    if (template) {
        const data = {
            title: "A PERSONAL BLOG",
            year: new Date().getFullYear(),
            articles: [
                { id: 1, title: "My article", date: "December 26, 2025" },
                { id: 2, title: "Another article", date: "December 27, 2025" },
                { id: 3, title: "Third article", date: "December 28, 2025" }
            ],
            isAuthenticated:false
        };


        ejs.renderFile(path.join(VIEWS_DIR, template), data, (err, html) => {
            if (err) {
                console.error(err);
                res.writeHead(500);
                res.end("Error rendering page");
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(html);
            }
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");

});

server.listen(port, () => console.log("Server running on port", port));
