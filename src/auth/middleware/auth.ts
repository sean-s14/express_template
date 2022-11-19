import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env
import express from "express";
import jwt from "jsonwebtoken";
import { Request } from "../method/jwt/types";


function authenticateToken(req: Request, res: express.Response, next: Function) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ err: "No access token was received" });

    jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
        // console.log("User:", user);
        if (err) return res.status(403).json({ err: "Access token could not be verified" });
        req.user = user
        next();
    });
}

export { authenticateToken };