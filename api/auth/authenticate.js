import jwt from "jsonwebtoken";

export const isAuthenticated = (req) =>{
    const cookies = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(";").forEach(cookie => {
            const [name, value] = cookie.split("=").map(c => c.trim());
            cookies[name] = value;
        });
    }

    if (!cookies.token) return false;

    try {
        jwt.verify(cookies.token, process.env.ACCESS_TOKEN_SECRET);
        return true;
    } catch (err) {
        return false;
    }
}

export default isAuthenticated;