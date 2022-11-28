import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import express from "express";
const router = express.Router();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateUsername2 } from "../../../utils/auth";
 
import { IUser, User as UserSchema } from "../../../schemas/user";
import { Token as TokenSchema } from "../../../schemas/token";
import { generateAccessToken, generateRefreshToken } from "../../../utils/auth";
import { MSG_TYPES } from "../../../utils/logging";


// =============== SIGNUP ===============
router.post("/signup", async (req: express.Request, res: express.Response) => {
    const { email, password, password2 } = req.body;
    const { username } = req.body;
    interface IUserBody { username?: string, email?: string, password: string};
    var userBody: IUserBody = { password: "" };

    
    { // ========== PASSWORD VALIDATION ==========
        if (!password) {
            return res.status(400).json({ password: "Please enter a password" });
        }
        if (!password2) {
            return res.status(400).json({ password2: "Please enter a matching password" });
        }
        if (password !== password2) {
            return res.status(400).json({ password2: "Passwords do not match" });
        }
        if (password && password.length < 8) {
            return res.status(400).json({ password: "Password must be at least 8 characters long" });
        }    
    }

    { // ========== USERNAME & EMAIL VALIDATION ==========
        
        // Verify that no user with username/email already exists
        if (!username && !email) {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "You must enter either an email or username" });
        }

        if (email) {
            try {
                const userExists = await UserSchema.findOne({ email: email });
                if (userExists) {
                    return res.status(400).json({ email: "A user with this email already exists" });
                } else {
                    userBody.email = email;
                }
            } catch (err: any) {
                console.log(err);
                return res.status(500).json({ email: "There was an error when validating email" });
            }
        }

        if (username) {
            try {
                const userExists = await UserSchema.findOne({ username: username });
                if (userExists) {
                    return res.status(400).json({ username: "A user with this username already exists" });
                } else {
                    userBody.username = username;
                }
            } catch (err: any) {
                console.log(err);
                return res.status(500).json({ username: "There was an error when validating username" });
            }
        } else {
            try {
                const generated_username = await generateUsername2();
                userBody.username = generated_username;
            } catch (err: any) {
                console.log(err);
                return res.status(500).json({ username: "There was an error when generating username" });
            }
        }
    }

    { // ========== CREATE PASSWORD HASH ==========
        try {
            var salt = bcrypt.genSaltSync(13)
            var hash = await bcrypt.hash(password, salt);
            userBody.password = hash;
        } catch (e: any) {
            console.log(e);
            return res.status(500).json({ password: "There was an error when creating a password hash" });
        }
    }

    { // ========== CREATE USER ==========
        try {
            const user = new UserSchema(userBody);
            await user.save();
        } catch(e: any) {
            console.log(e);
            return res.status(500).json(e.errors)
        }
    }

    return res.status(201).json({ [MSG_TYPES.SUCCESS]: "Your account has been created" })
})

// =============== LOGIN ===============
router.post("/login", async (req: express.Request, res: express.Response) => {
    // TODO: Search through database for user with specified username/email and then match password 
    const { username, password } = req.body;

    try { // ===== FIND USER WITH EMAIL/USERNAME =====
        var user: IUser | null = await UserSchema.findOne({ username: username });
        if (!user) {
            user = await UserSchema.findOne({ email: username });
            if (!user) return res.status(404).json("User with specified username/email could not be found");
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json("There was an error when logging in");
    }

    try { // ===== VALIDATE PASSWORD ===== 
        var isValid = await bcrypt.compare(password, user.password || '');
        if (!isValid) return res.status(403).json({ password: "Password entered is invalid" });
    } catch (e) {
        console.log(e);
        return res.status(500).json("There was an issue validating the password");
    }

    { // ===== GENERATE ACCESS & REFRESH TOKENS =====
        const user2 = { username: username, id: user._id, role: user.role };
        
        var accessToken = generateAccessToken(user2);
        if (accessToken === null) {
            return res.json({ err: "Could not generate access token due to missing access token secret" })
        }

        var refreshToken = generateRefreshToken(user2);
        if (refreshToken === null) {
            return res.json({ err: "Could not generate refresh token due to missing refresh token secret" })
        }
    }

    try { // ===== CREATE OR UPDATE TOKENS IN DB =====
        const tokenInDB = await TokenSchema.findOne({ user: user._id })
        if (!tokenInDB) {
            const token = new TokenSchema({
                refresh_token: refreshToken,
                access_token: accessToken,
                user: user._id,
            })
            await token.save();
        } else {
            const token = await TokenSchema.findOneAndUpdate(
                { user: user._id },
                { refresh_token: refreshToken, access_token: accessToken },
            )
        }
    } catch(e: any) {
        console.log(e);
        return res.status(500).json({
            ...e.errors, 
            error: "Failed to update authentication tokens in database"
        });
    }

    res.cookie("refreshToken", refreshToken, { httpOnly: true, signed: true, secure: true });

    return res.json({ accessToken: accessToken });
});

// =============== REFRESH TOKEN ===============
router.post("/refresh", async (req: express.Request, res: express.Response) => {
    const { refreshToken } = req.signedCookies;

    if (refreshToken == null) return res.status(401).json({[MSG_TYPES.ERROR]:"No refresh token found in cookie"});

    try { // ===== FIND REFRESH TOKEN IN DATABASE =====
        const refreshTokenInDB = await TokenSchema.findOne({ refresh_token: refreshToken });
        if (!refreshTokenInDB) return res.status(403).json({ [MSG_TYPES.ERROR]: "Could not find refresh token in database" });
    } catch (e) {
        console.log(e);
        return res.json({ error: "There was an error attempting to find refresh token in the database"})
    }

    jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, async (err: any, user: any) => {
        if (err) return res.status(403).json({[MSG_TYPES.ERROR]:"Unable to verify refresh token"});

        // ===== GENERATE ACCESS & REFRESH TOKENS ===== 
        const accessToken = generateAccessToken({ username: user.username });
        const newRefreshToken = generateRefreshToken({ username: user.username });

        try { // ===== UPDATE TOKENS IN DB =====
            const token = await TokenSchema.findOneAndUpdate(
                { refresh_token: refreshToken },
                { refresh_token: newRefreshToken, access_token: accessToken },
            )
        } catch(e: any) {
            console.log(e);
            return res.status(500).json(e.errors);
        }

        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, signed: true, secure: true });

        return res.json({ accessToken: accessToken });
    })
})

// =============== LOGOUT ===============
router.delete("/logout", async (req: express.Request, res: express.Response) => {
    const { refreshToken } = req.signedCookies;
    if (refreshToken) {
        res.clearCookie("refreshToken", { httpOnly: true, signed: true, secure: true });
    }
    try {
        const token = await TokenSchema.findOneAndDelete({ refresh_token: refreshToken });
        if (token === null) {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "Unable to log out" })
        }
        return res.status(204);
    } catch(e: any) {
        console.log(e);
        return res.status(500).json(e.errors);
    }
})

export default router;