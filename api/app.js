import ejs from "ejs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import http from "http";
import fs from "fs";
import path from "path";
import { parse as parseQuery } from "querystring";
import { fileURLToPath, parse } from "url";

import pageMap from "./config/pageMap.js";
import isAuthenticated from "./auth/authenticate.js";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const PUBLIC_DIR = path.join(DIRNAME, "../public");
const VIEWS_DIR = path.join(DIRNAME, "../views");

dotenv.config();

const port = process.env.PORT || 4400;

const server = http.createServer((req, res) => {

    const authorized = isAuthenticated(req);

    const cleanPath = parse(req.url).pathname;


    //CSS-LOADER!
    if (cleanPath === "/styles/styles.css") {
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

    //WHITELIST
    if (cleanPath === "/new.html" && !authorized) {
        res.writeHead(302, {
            "Location": "/index.html",
            "ERROR":"Missing credentials!"
        });
        res.end();
        return;
    }

    //LOGOUT!
    if (cleanPath === "/logout" && req.method === "POST") {
        res.writeHead(302, {
            "Location": "/index.html",
            "Set-Cookie": "token=; HttpOnly; Max-Age=0"
        });
        res.end();
        return;
    };

    //LOGIN!
    if (cleanPath === "/login" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const parsed = parseQuery(body);
            const { username, password } = parsed;
            if(username === process.env.USERNAME && password === process.env.PASSWORD) {
                const token = jwt.sign({ name: username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
                res.writeHead(302, {
                    "Location": "/index.html",
                    "Set-Cookie": `token=${token}; HttpOnly`
                });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(302, {
                    "Location": "/login.html"
                });
                res.end(JSON.stringify({ success: false, message: "Invalid credentials" }));
            }
        });
        return;
    }
    

    //RENDERING HTML! 
    //ONLY DEPENDS ON "DATA", NEEEDS A REFACTORING! 

    const template = pageMap[cleanPath];
    if (template) {
        fs.readFile("./posts/posts.json", "utf-8", (err, data) => {
            let jsonData = { 
                articles: [], 
                isAuthenticated: authorized, 
                year: new Date().getFullYear()
            };
        
            if (err) {
                console.error("Error reading file, creating new one:", err);
                const initialList = JSON.stringify({ articles: [] }, null, 2);
                fs.writeFile("./posts/posts.json", initialList, (err) => {
                    if (err) console.error(err);
                    console.log("File has been saved!");
                });
            } else {
                try {
                    const parsed = JSON.parse(data);
                    jsonData.articles = parsed.articles || [];
                    console.log(authorized);
                } catch (parseErr) {
                    console.error("Error parsing JSON:", parseErr);
                    jsonData.articles = [];
                }
            }

            ejs.renderFile(path.join(VIEWS_DIR, template), jsonData, (err, html) => {
                console.log(jsonData);
                if (err) {
                    console.error("EJS render error:", err);
                    res.writeHead(500);
                    res.end("Error rendering page");
                } else {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    res.end(html);
                }
            });
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
});

server.listen(port, () => console.log("Server running on port", port));
