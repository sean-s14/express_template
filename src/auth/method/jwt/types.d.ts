import express from "express";
import { ITokenUser } from "../../utils/auth";


export interface JWT_User extends ITokenUser {
    iat: number;
    exp: number;
}

export interface Request extends express.Request {
    user?: JWT_User
}