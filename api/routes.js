import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

import isAuthenticated from "./auth/authenticate.js";
import pageMap from "./config/pageMap.js";
import { renderPage, readPosts, writePosts, generateId, parsePathId, formatDate } from "./helpers/helpers.js";

export const routes = [
    // ------------------- CSS -------------------
    {
        method: "GET",
        path: /^\/styles\/.+/,
        handler: async (req, res) => {
            const pathMatch = req.url;
            fs.readFile(path.join("./public", pathMatch), (err, data) => {
                if (err) res.writeHead(404).end();
                else res.writeHead(200, { "Content-Type": "text/css" }).end(data);
            });
        }
    },

    // ------------------- LOGIN -------------------
    {
        method: "POST",
        path: "/login",
        handler: (req, res) => {
            let body = "";
            req.on("data", chunk => body += chunk.toString());
            req.on("end", () => {
                const { username, password } = Object.fromEntries(new URLSearchParams(body));
                if (username === process.env.USERNAME && password === process.env.PASSWORD) {
                    const token = jwt.sign({ name: username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
                    res.writeHead(302, { Location: "/index.html", "Set-Cookie": `token=${token}; HttpOnly` }).end();
                } else {
                    res.writeHead(302, { Location: "/login.html" }).end();
                }
            });
        }
    },

    // ------------------- LOGOUT -------------------
    {
        method: "POST",
        path: "/logout",
        handler: (req, res) => {
            res.writeHead(302, { Location: "/index.html", "Set-Cookie": "token=; HttpOnly; Max-Age=0" }).end();
        }
    },

    // ------------------- INDEX -------------------
    {
        method: "GET",
        path: /^\/(index\.html)?$/,
        handler: (req, res) => {
            const authorized = isAuthenticated(req);
            readPosts(posts => {
                renderPage(res, "index.ejs", {
                    articles: posts.articles,
                    year: new Date().getFullYear(),
                    isAuthenticated: authorized
                });
            });
        }
    },

    // ------------------- VIEW ARTICLE -------------------
    {
        method: "GET",
        path: /^\/article\/.+$/,
        handler: (req, res) => {
            const authorized = isAuthenticated(req);
            const id = parsePathId(req.url);
            readPosts(posts => {
                const article = posts.articles.find(a => a.id === id);
                if (!article) return res.writeHead(404).end("Not found");
                renderPage(res, "article.ejs", { article, year: new Date().getFullYear(), isAuthenticated: authorized });
            });
        }
    },

    // ------------------- NEW / EDIT PAGE -------------------
    {
        method: "GET",
        path: /^\/new(\.html)?(\/.+)?$/,
        handler: (req, res) => {
            const authorized = isAuthenticated(req);
            if (!authorized) return res.writeHead(302, { Location: "/index.html" }).end();
    
            const id = parsePathId(req.url) || null;
    
            readPosts(posts => {
                let article = {};
                if (id) {
                    const found = posts.articles.find(a => a.id === id);
                    if (found) article = found;
                }
    
                if (!article.date) article.date = formatDate();
    
                renderPage(res, "new.ejs", {
                    article,
                    id,
                    year: new Date().getFullYear(),
                    isAuthenticated: authorized
                });
            });
        }
    },    

    // ------------------- CREATE / UPDATE -------------------
    {
        method: "POST",
        path: /^\/(new|update)(\/.+)?$/,
        handler: (req, res) => {
            const authorized = isAuthenticated(req);
            if (!authorized) return res.writeHead(403).end("Forbidden");

            let body = "";
            req.on("data", c => body += c.toString());
            req.on("end", () => {
                const postData = Object.fromEntries(new URLSearchParams(body));
                readPosts(posts => {
                    const id = req.url.startsWith("/update/") ? parsePathId(req.url) : generateId();

                    if (req.url.startsWith("/update/")) {
                        const idx = posts.articles.findIndex(a => a.id === id);
                        if (idx === -1) return res.writeHead(404).end("Not found");
                        posts.articles[idx] = { ...postData, id };
                    } else {
                        posts.articles.push({ ...postData, id });
                    }

                    writePosts(posts, () => res.writeHead(302, { Location: "/index.html" }).end());
                });
            });
        }
    },

    // ------------------- DELETE -------------------
    {
        method: "POST",
        path: /^\/delete\/.+$/,
        handler: (req, res) => {
            const authorized = isAuthenticated(req);
            if (!authorized) return res.writeHead(403).end("Forbidden");

            const id = parsePathId(req.url);
            readPosts(posts => {
                posts.articles = posts.articles.filter(a => a.id !== id);
                writePosts(posts, () => res.writeHead(302, { Location: "/index.html" }).end());
            });
        }
    }
];
