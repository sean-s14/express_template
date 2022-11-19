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
import { MSG_TYPES } from "../../../../utils/messageTypes";

// router.use((req: express.Request, res: express.Response, next: Function) => {
//     console.log("Request Body:", req?.body);
//     next()
// })

// =============== SIGNUP ===============
router.post("/signup", async (req: express.Request, res: express.Response) => {
    const { email, password, password2 } = req.body;
    let { username } = req.body;

    // ========== PASSWORD VALIDATION ==========
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

    // Verify that no user with username/email already exists
    if (!username && !email) {
        return res.status(400).json({ [MSG_TYPES.ERROR]: "You must enter either an email or username" });
    }
    if (email) {
        const userExists = await UserSchema.findOne({ email: email });
        if (userExists) {
            return res.status(400).json({ email: "A user with this email already exists" });
        }
    } 
    if (username) {
        const userExists = await UserSchema.findOne({ username: username });
        if (userExists) {
            return res.status(400).json({ username: "A user with this username already exists" });
        }
    } else if (!username) {
        // Generate username if no username given
        username = generateUsername2();
    }

    // Hash password
    const salt = bcrypt.genSaltSync(13)
    const hash = await bcrypt.hash(password, salt);

    // Create user
    try {
        const user = new UserSchema({
            username: username,
            email: email,
            password: hash,
        })
        await user.save();
    } catch(e: any) {
        console.log(e);
        return res.status(500).json(e.errors)
    }

    return res.status(201).json({ [MSG_TYPES.SUCCESS]: "Your account has been created" })
})

// =============== LOGIN ===============
router.post("/login", async (req: express.Request, res: express.Response) => {
    // TODO: Search through database for user with specified username/email and then match password 
    const { username, password } = req.body;

    const user: IUser | null = await UserSchema.findOne({ username: username });
    if (!user) return res.status(404).json("User with specified username could not be found");

    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) return res.status(403).json("Password entered is invalid");

    const user2 = { username: username, id: user._id, role: user.role };
    const accessToken = generateAccessToken(user2);
    if (accessToken === null) return res.json({ err: "Could not generate access token due to missing access token secret" })
    const refreshToken = generateRefreshToken(user2);
    if (refreshToken === null) return res.json({ err: "Could not generate refresh token due to missing refresh token secret" })

    try {
        // console.log("Refresh Token:", refreshToken);
        console.log("User ID:", user._id);
        const tokenInDB = await TokenSchema.findOne({ user: user._id })
        // console.log("Token in DB:", tokenInDB);
        console.log("Token in DB (Bool):", !!tokenInDB);
        if (!tokenInDB) {
            const token = new TokenSchema({
                refresh_token: refreshToken,
                access_token: accessToken,
                user: user._id,
            })
            await token.save();
        } else {
            // console.log("Updating schema...")
            const token = await TokenSchema.findOneAndUpdate(
                { user: user._id },
                { refresh_token: refreshToken, access_token: accessToken },
            )
        }
    } catch(e: any) {
        console.log(e);
        return res.status(500).json(e.errors);
        // return res.status(400).json("Failed to create refresh token");
    }

    // res.cookie("refreshToken", refreshToken, {httpOnly: true, secure: true});
    res.cookie("refreshToken", refreshToken, { httpOnly: true, signed: true });
    // res.cookie("refreshToken", refreshToken);

    return res.json({ accessToken: accessToken }) // , refreshToken: refreshToken });
});

// =============== REFRESH TOKEN ===============
router.post("/refresh", async (req: express.Request, res: express.Response) => {
    const { refreshToken } = req.signedCookies;
    // console.log("Signed Cookie:", refreshToken);

    if (refreshToken == null) return res.status(401).json({[MSG_TYPES.ERROR]:"No refresh token found in cookie"});

    const refreshTokenInDB = await TokenSchema.findOne({ refresh_token: refreshToken });
    if (!refreshTokenInDB) return res.status(403).json({ [MSG_TYPES.ERROR]: "Could not find refresh token in database" });
    // if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

    jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, async (err: any, user: any) => {
        if (err) return res.status(403).json({[MSG_TYPES.ERROR]:"Unable to verify refresh token"});
        const accessToken = generateAccessToken({ username: user.username });
        // Replace old refresh token
        // deleteRefreshToken(req)

        const newRefreshToken = generateRefreshToken({ username: user.username });
        // refreshTokens.push(refreshToken);
        try {
            const token = await TokenSchema.findOneAndUpdate(
                { refresh_token: refreshToken },
                { refresh_token: newRefreshToken, access_token: accessToken },
            )
            // console.log("Token:", token);
        } catch(e: any) {
            console.log(e);
            return res.status(500).json(e.errors);
        }

        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, signed: true });
        // Return 2 new tokens
        return res.json({ accessToken: accessToken }) // , refreshToken: newRefreshToken });
    })
})

// =============== LOGOUT ===============
router.delete("/logout", async (req: express.Request, res: express.Response) => {
    const { refreshToken } = req.signedCookies;
    if (refreshToken) {
        res.clearCookie("refreshToken", { httpOnly: true, signed: true });
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