import fs from "fs";
import path from "path";
import ejs from "ejs";

const POSTS_FILE = path.join("./api/posts/posts.json");

// Render EJS safely
export function renderPage(res, template, data) {
    const templatePath = path.join("./views", template);
    ejs.renderFile(templatePath, data, (err, html) => {
        if (err) {
            console.error("EJS render error:", err);
            res.writeHead(500);
            res.end("Error rendering page");
        } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        }
    });
}

// Read posts.json
export function readPosts(callback) {
    if (!fs.existsSync(POSTS_FILE)) {
        fs.mkdirSync(path.dirname(POSTS_FILE), { recursive: true });
        fs.writeFileSync(POSTS_FILE, JSON.stringify({ articles: [] }, null, 2));
    }

    fs.readFile(POSTS_FILE, "utf-8", (err, data) => {
        if (err) return callback({ articles: [] });
        try {
            const posts = JSON.parse(data);
            callback(posts);
        } catch {
            callback({ articles: [] });
        }
    });
}

// Write posts.json
export function writePosts(posts, callback) {
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), callback);
}

// Generate a unique id
export function generateId() {
    return Date.now().toString();
}

// Extract id from path like /update/:id
export function parsePathId(url) {
    const parts = url.split("/");
    return parts[2] || null;
}

// Format current date YYYY-MM-DD
export function formatDate() {
    return new Date().toISOString().slice(0, 10);
}
