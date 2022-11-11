import jwt from "jsonwebtoken";
import { generateUsername } from "unique-username-generator";
import TokenSchema from "../schemas/token.js";
import UserSchema from "../schemas/user.js";

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
}

function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "2d" });
}

const updateOrCreateToken = async (user, tokens) => {
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
    let userExists = true;
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