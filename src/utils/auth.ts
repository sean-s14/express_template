import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import jwt from "jsonwebtoken";
import { generateUsername } from "unique-username-generator";
import { IToken, Token as TokenSchema } from "../schemas/token";
import { User as UserSchema } from "../schemas/user";

function generateAccessToken(user: object) {
    return jwt.sign(user, env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
}

function generateRefreshToken(user: object) {
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
    console.log("Generated Username:", username)
    return username;
}

export {
    generateAccessToken,
    generateRefreshToken,
    updateOrCreateToken,
    generateUsername2,
}