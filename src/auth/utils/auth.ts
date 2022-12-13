import * as dotenv from "dotenv";
dotenv.config();
const env: NodeJS.ProcessEnv = process.env;

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateUsername } from "unique-username-generator";

import { IToken, Token as TokenSchema } from "../schemas/token";
import { User as UserSchema } from "../schemas/user";

interface IUserBase {
    id?: mongoose.Types.ObjectId;
    role?: string;
}

interface IUserName extends IUserBase {
    username: string;
}

interface IUserEmail extends IUserBase {
    email: string;
}

interface IUserNameAndEmail extends IUserBase {
    username: string;
    email: string;
}

type ITokenUser = IUserName | IUserEmail | IUserNameAndEmail;

function generateAccessToken(user: ITokenUser): string | null {
    if (env?.ACCESS_TOKEN_SECRET === undefined) return null;
    return jwt.sign(user, env?.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
}

function generateRefreshToken(user: ITokenUser) {
    if (env?.REFRESH_TOKEN_SECRET === undefined) return null;
    return jwt.sign(user, env.REFRESH_TOKEN_SECRET, { expiresIn: "2d" });
}

const updateOrCreateToken = async (user: any, tokens: IToken) => {
    return TokenSchema.findOneAndUpdate(
        { user: user._id },
        { 
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
        },
        { new: true, upsert: true}
    );
}

const generateUsername2 = async () => {
    let username;
    let userExists: boolean | object | null = true;
    while (userExists) {
        username = generateUsername("", 3);
        userExists = await UserSchema.findOne({ username: username });
    }
    return username;
}

export {
    generateAccessToken,
    generateRefreshToken,
    updateOrCreateToken,
    generateUsername2,
    
    ITokenUser,
}