import http from "http";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { parse as parseQuery } from "querystring";
import { fileURLToPath } from "url";
import { parse } from "url";

import pageMap from "./config/pageMap.js";
import isAuthenticated from "./auth/authenticate.js";

dotenv.config();

/* -------------------- PATHS -------------------- */

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);

const PUBLIC_DIR = path.join(DIRNAME, "../public");
const VIEWS_DIR = path.join(DIRNAME, "../views");
const POSTS_DIR = path.join(DIRNAME, "posts");
const POSTS_FILE = path.join(POSTS_DIR, "posts.json");

const port = process.env.PORT || 4400;

/* -------------------- HELPERS -------------------- */

const renderPage = (res, template, data) => {
    ejs.renderFile(
        path.join(VIEWS_DIR, template),
        data,
        (err, html) => {
            if (err) {
                console.error("EJS render error:", err);
                res.writeHead(500);
                res.end("Error rendering page");
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(html);
            }
        }
    );
};

const  readPosts = (callback) => {
    fs.readFile(POSTS_FILE, "utf-8", (err, data) => {
        if (err) {
            const empty = { articles: [] };
            fs.mkdirSync(POSTS_DIR, { recursive: true });
            fs.writeFileSync(POSTS_FILE, JSON.stringify(empty, null, 2));
            callback(empty);
        } else {
            callback(JSON.parse(data));
        }
    });
};

/* -------------------- SERVER -------------------- */

const server = http.createServer((req, res) => {
    const authorized = isAuthenticated(req);
    const cleanPath = parse(req.url).pathname;

    /* ---------- CSS ---------- */

    if (cleanPath === "/styles/styles.css") {
        fs.readFile(path.join(PUBLIC_DIR, cleanPath), (err, data) => {
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

    /* ---------- AUTH GUARD ---------- */

    if (cleanPath === "/new.html" && !authorized) {
        res.writeHead(302, { Location: "/index.html" });
        res.end();
        return;
    }

    /* ---------- LOGOUT ---------- */

    if (cleanPath === "/logout" && req.method === "POST") {
        res.writeHead(302, {
            Location: "/index.html",
            "Set-Cookie": "token=; HttpOnly; Max-Age=0"
        });
        res.end();
        return;
    }

    /* ---------- LOGIN ---------- */

    if (cleanPath === "/login" && req.method === "POST") {
        let body = "";
        req.on("data", c => (body += c.toString()));
        req.on("end", () => {
            const { username, password } = parseQuery(body);

            if (
                username === process.env.USERNAME &&
                password === process.env.PASSWORD
            ) {
                const token = jwt.sign(
                    { name: username },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "1h" }
                );

                res.writeHead(302, {
                    Location: "/index.html",
                    "Set-Cookie": `token=${token}; HttpOnly`
                });
                res.end();
            } else {
                res.writeHead(302, { Location: "/login.html" });
                res.end();
            }
        });
        return;
    }

    /* ---------- CREATE ---------- */

    if (cleanPath === "/new.html" && req.method === "POST") {
        let body = "";
        req.on("data", c => (body += c.toString()));
        req.on("end", () => {
            const newArticle = parseQuery(body);

            readPosts(posts => {
                posts.articles.push(newArticle);
                fs.writeFile(
                    POSTS_FILE,
                    JSON.stringify(posts, null, 2),
                    () => {
                        res.writeHead(302, { Location: "/index.html" });
                        res.end();
                    }
                );
            });
        });
        return;
    }

    /* ---------- UPDATE ---------- */

    if (cleanPath.startsWith("/update/") && req.method === "POST") {
        const index = parseInt(cleanPath.split("/")[2], 10);
        if (isNaN(index)) {
            res.writeHead(400);
            res.end("Invalid index");
            return;
        }

        let body = "";
        req.on("data", c => (body += c.toString()));
        req.on("end", () => {
            const updated = parseQuery(body);

            readPosts(posts => {
                if (!posts.articles[index]) {
                    res.writeHead(400);
                    res.end("Index out of bounds");
                    return;
                }

                posts.articles[index] = updated;

                fs.writeFile(
                    POSTS_FILE,
                    JSON.stringify(posts, null, 2),
                    () => {
                        res.writeHead(302, { Location: "/index.html" });
                        res.end();
                    }
                );
            });
        });
        return;
    }

    /* ---------- DELETE ---------- */

    if (cleanPath.startsWith("/delete/") && req.method === "POST") {
        const index = parseInt(cleanPath.split("/")[2], 10);

        readPosts(posts => {
            posts.articles.splice(index, 1);
            fs.writeFile(
                POSTS_FILE,
                JSON.stringify(posts, null, 2),
                () => {
                    res.writeHead(302, { Location: "/index.html" });
                    res.end();
                }
            );
        });
        return;
    }

    /* ---------- EDIT (GET) ---------- */

    if (cleanPath.startsWith("/new/") && req.method === "GET") {
        const index = parseInt(cleanPath.split("/")[2], 10);

        readPosts(posts => {
            renderPage(res, "new.ejs", {
                articles: posts.articles,
                article: posts.articles[index],
                id: index,
                year: new Date().getFullYear(),
                isAuthenticated: authorized
            });
        });
        return;
    }

    /* ---------- DEFAULT RENDER ---------- */

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

    /* ---------- 404 ---------- */

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found");
});

/* -------------------- START -------------------- */

server.listen(port, () =>
    console.log(`Server running on port ${port}`)
);
