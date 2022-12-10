import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env
import express from "express";
import jwt from "jsonwebtoken";
import { Request } from "../method/jwt/types";
import { isAdmin, isSuperuser } from "../permissions/auth";
import { MSG_TYPES, ERRORS, log } from "../utils/logging";


function authenticateToken(req: Request, res: express.Response, next: Function) {
    const { authorization: authHeader } = req.headers;
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ [MSG_TYPES.ERROR]: "No access token was received" });

    jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
        if (err) {
            log(err);
            return res.status(403).json({ [MSG_TYPES.ERROR]: "Access token could not be verified" });
        }
        req.user = user
        next();
    });
}

function checkPermissions(req: Request, res: express.Response, next: Function) {
    const { body, user } = req;
    if (body) {
        if (req.method !== "GET") {
            if (body.hasOwnProperty("role") && !isSuperuser(user)) {
                return res.status(403).send({ [MSG_TYPES.ERROR]: ERRORS.NOT_SUPERUSER });
            }
            if (body.hasOwnProperty(
                "verified" || "createdAt" || "updatedAt" || "_id" || "__v" || "googleId"
                ) && !isAdmin(user)) {
                return res.status(403).send({ [MSG_TYPES.ERROR]: ERRORS.NOT_ADMIN });
            }
        }
    }
    next();
}

export { authenticateToken, checkPermissions };