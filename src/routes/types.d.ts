import express from "express";

export interface JWT_User {
    username: string,
    id: string,
    role: string,
    iat: number,
    exp: number,
}

export interface Request extends express.Request {
    user?: JWT_User
}