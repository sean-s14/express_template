import * as dotenv from "dotenv";
dotenv.config();
const env: NodeJS.ProcessEnv = process.env;

import jwt from "jsonwebtoken";
import { generateUsername } from "unique-username-generator";

import { IToken, Token as TokenModel } from "../schemas/token";
import { User as UserModel } from "../schemas/user";

interface ITokenUser {
  _id: string;
  username: string;
  role: string;
}

function generateAccessToken(user: ITokenUser): string | null {
  if (env?.ACCESS_TOKEN_SECRET === undefined) return null;
  return jwt.sign(user, env?.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
}

function generateRefreshToken(user: ITokenUser) {
  if (env?.REFRESH_TOKEN_SECRET === undefined) return null;
  return jwt.sign(user, env.REFRESH_TOKEN_SECRET, { expiresIn: "2d" });
}

const updateOrCreateToken = async (user: any, tokens: IToken) => {
  return TokenModel.findOneAndUpdate(
    { user: user._id },
    {
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
    },
    { new: true, upsert: true }
  );
};

const generateUsername2 = async () => {
  let username;
  let userExists: boolean | object | null = true;
  while (userExists) {
    username = generateUsername("", 3);
    userExists = await UserModel.findOne({ username: username });
  }
  return username;
};

function generateVerificationCode(qty: number = 4): string {
  let code: string = "";
  for (let i = 0; i < qty; i++) {
    const num: number = Math.floor(Math.random() * 10);
    code += num.toString();
  }
  return code;
}

export {
  generateAccessToken,
  generateRefreshToken,
  updateOrCreateToken,
  generateUsername2,
  generateVerificationCode,
  ITokenUser,
};
