import http from "http";
import dotenv from "dotenv";
import { routes } from "./routes.js";

dotenv.config();
const port = process.env.PORT || 4400;

const server = http.createServer((req, res) => {
    const route = routes.find(r => {
        if(typeof r.path === "string") return r.path === req.url && r.method === req.method;
        if(r.path instanceof RegExp) return r.path.test(req.url) && r.method === req.method;
        return false;
    });

    if(route) return route.handler(req, res);

    res.writeHead(404).end("Not found");
});

server.listen(port, () => console.log(`Server running on port ${port}`));
