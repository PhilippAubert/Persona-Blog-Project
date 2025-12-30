import { defineConfig } from "eslint/config";

export const isAuthenticated = (req) => {
    const cookies = req.headers.cookie || "";
    const tokenCookie = cookies
        .split(";")
        .find(c => c.trim().startsWith("token="));

    if (!tokenCookie) return false;

    const token = tokenCookie.split("=")[1];

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return true;
    } catch {
        return false;
    }
};
export default isAuthenticated;