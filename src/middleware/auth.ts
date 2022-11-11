import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env
import jwt from "jsonwebtoken";

function authenticateToken(req: any, res: any, next: Function) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ err: "No access token was received" });

    jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ err: "Access token could not be verified" });
        req.user = user
        next();
    });
}

export { authenticateToken };