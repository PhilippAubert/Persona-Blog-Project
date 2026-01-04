import http from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { parse as parseQuery } from "querystring";
import { parse as parseURL } from "url";

import pageMap from "./config/pageMap.js";
import isAuthenticated from "./auth/authenticate.js";
import { renderPage, 
    readPosts, 
    writePosts, 
    generateId, 
    parsePathId, 
    formatDate } 
    from "./helpers/helpers.js";

dotenv.config();
const port = process.env.PORT || 4400;

const server = http.createServer((req, res) => {
    const authorized = isAuthenticated(req);
    const cleanPath = parseURL(req.url).pathname;

    // ------------------- CSS -------------------
    if (cleanPath.startsWith("/styles/")) {
        fs.readFile(path.join("./public", cleanPath), (err, data) => {
            if (err) res.writeHead(404).end();
            else res.writeHead(200, { "Content-Type": "text/css" }).end(data);
        });
        return;
    }

    // ------------------- LOGIN -------------------
    if (cleanPath === "/login" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            const { username, password } = parseQuery(body);
            if (username === process.env.USERNAME && password === process.env.PASSWORD) {
                const token = jwt.sign({ name: username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
                res.writeHead(302, { Location: "/index.html", "Set-Cookie": `token=${token}; HttpOnly` });
                res.end();
            } else {
                res.writeHead(302, { Location: "/login.html" });
                res.end();
            }
        });
        return;
    }

    // ------------------- LOGOUT -------------------
    if (cleanPath === "/logout" && req.method === "POST") {
        res.writeHead(302, { Location: "/index.html", "Set-Cookie": "token=; HttpOnly; Max-Age=0" });
        res.end();
        return;
    }

    // ------------------- NEW / EDIT FORM -------------------
    if (cleanPath.startsWith("/new") && req.method === "GET") {
        if (!authorized) return res.writeHead(302, { Location: "/index.html" }).end();

        const id = parsePathId(cleanPath);
        readPosts(posts => {
            const article = id ? posts.articles.find(a => a.id === id) : null;
            renderPage(res, "new.ejs", {
                article,
                id,
                year: new Date().getFullYear(),
                isAuthenticated: authorized,
                currentDate: formatDate()
            });
        });
        
        return;
    }

    // ------------------- CREATE / UPDATE -------------------
    if ((cleanPath.startsWith("/new") || cleanPath.startsWith("/update")) && req.method === "POST") {
        if (!authorized) return res.writeHead(403).end("Forbidden");

        let body = "";
        req.on("data", c => body += c.toString());
        req.on("end", () => {
            const postData = parseQuery(body);

            readPosts(posts => {
                const id = cleanPath.startsWith("/update/") ? parsePathId(cleanPath) : generateId();

                if (cleanPath.startsWith("/update/")) {
                    const idx = posts.articles.findIndex(a => a.id === id);
                    if (idx === -1) return res.writeHead(404).end("Not found");
                    posts.articles[idx] = { ...postData, id };
                } else {
                    posts.articles.push({ ...postData, id });
                }

                writePosts(posts, () => res.writeHead(302, { Location: "/index.html" }).end());
            });
        });
        return;
    }

    // ------------------- DELETE -------------------
    if (cleanPath.startsWith("/delete/") && req.method === "POST") {
        if (!authorized) return res.writeHead(403).end("Forbidden");

        const id = parsePathId(cleanPath);
        readPosts(posts => {
            posts.articles = posts.articles.filter(a => a.id !== id);
            writePosts(posts, () => res.writeHead(302, { Location: "/index.html" }).end());
        });
        return;
    }

    // ------------------- VIEW ARTICLE -------------------
    if (cleanPath.startsWith("/article/") && req.method === "GET") {
        const id = parsePathId(cleanPath);
        readPosts(posts => {
            const article = posts.articles.find(a => a.id === id);
            if (!article) return res.writeHead(404).end("Not found");
            renderPage(res, "article.ejs", { article, year: new Date().getFullYear(), isAuthenticated: authorized });
        });
        return;
    }

    // ------------------- DEFAULT / INDEX -------------------
    const template = pageMap[cleanPath];
    if (template) {
        readPosts(posts => {
            renderPage(res, template, {
                articles: posts.articles,
                year: new Date().getFullYear(),
                isAuthenticated: authorized
            });
        });
        return;
    }

    res.writeHead(404).end("Page not found");
});

server.listen(port, () => console.log(`Server running on port ${port}`));
