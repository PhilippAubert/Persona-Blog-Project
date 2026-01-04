import fs from "fs";
import path from "path";
import ejs from "ejs";
import crypto from "crypto";

// -------------------- PATHS --------------------
export const DIRNAME = path.resolve();
export const POSTS_DIR = path.join(DIRNAME, "api", "posts");
export const POSTS_FILE = path.join(POSTS_DIR, "posts.json");
export const VIEWS_DIR = path.join(DIRNAME, "views");

// -------------------- HELPERS --------------------
export const renderPage = (res, template, data) =>
    ejs.renderFile(path.join(VIEWS_DIR, template), data, (err, html) => {
        if (err) {
            console.error("EJS render error:", err);
            res.writeHead(500);
            res.end("Error rendering page");
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        }
    });

export const readPosts = (callback) => {
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

export const writePosts = (posts, callback) =>
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), callback);

export const generateId = () => crypto.randomBytes(6).toString("hex");

export const parsePathId = (urlPath) => {
    const parts = urlPath.split("/").filter(Boolean);
    return parts.length > 1 ? parts[1] : null;
};

export const formatDate = (date = new Date()) => {
    return date.toLocaleDateString("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};
