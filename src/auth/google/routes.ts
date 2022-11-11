import * as dotenv from "dotenv";
dotenv.config();
const { CLIENT_URL } = process.env;
import express from "express";
const router = express.Router();
import { google } from "googleapis";

import { updateOrCreateToken, generateUsername2 } from "../../utils/auth";
import googleSetup from "./setup";
import { User as UserSchema } from "../../schemas/user";

const cookie_options = { secure: true, httpOnly: true, signed: true };

const getTokens = async (refresh_token: string) => {{
    const { oauth2Client } = googleSetup();
    oauth2Client.setCredentials({refresh_token: refresh_token});
    oauth2Client.getAccessToken((err: any, token) => {
        if (err) throw new Error("Unable to retrieve new access token");
        if (token) return {access_token: token, refresh_token: refresh_token};
    });
}};

/**
 * @param tokens
 * In the form
 * {
 *   refresh_token: ###,
 *   access_token: ###
 * }
 */
const getUserInfo = async (tokens: any) => {
    const { oauth2Client } = googleSetup();
    oauth2Client.setCredentials(tokens);  // SET THE CREDENTIALS TO TOKENS
    google.options({auth: oauth2Client}); // SET GOOGLE AUTH TO OAUTH2 CLIENT

    // ===== RETRIEVE USER INFO =====
    const oauth2 = await google.oauth2("v2");
    const { data } = await oauth2.userinfo.get({});
    return data;
}

const usersExist = (user: any) => {
    return !!user 
        && (user !== null) 
        && Array.isArray(user) 
        && (user.length > 0);
}

router.get("/", (req: any, res) => {
    const { authorizationUrl } = googleSetup();
    return res.redirect(authorizationUrl);
});

/**
 * Get access and refresh tokens using code received in query
 * Set the oauth2Client credentials to the tokens received
 * Set google options "auth" property to oauth2Client
 * Get user info
 * Return error in cookie "google.error" if users email has not been verified
 * Search for user in mongodb using googleId from user info
 * If (google_user === null):
 *   Search for user in mongodb using email from user info
 * If user exists:
 *   Update users associated token or create a token if one doesn"t exist
 * If user does not exist:
 *   Create user
 *   Create tokens
 * Set response cookies to access & refresh tokens
 */
router.get("/callback", async (req: any, res: any) => {
    const { code } = req.query;
    const { oauth2Client } = googleSetup();

    // ===== GET TOKENS FROM CODE =====
    const { tokens }: any = await oauth2Client.getToken(code);
    // console.log("Tokens:", tokens);
    
    // ===== GET USER INFO =====
    let userInfo: any;
    try {
        userInfo = await getUserInfo(tokens);
        // console.log("User Info :", userInfo);
        if (!userInfo) return res.redirect(500, CLIENT_URL);
    } catch(e: any) {
        console.log(e);
        return res.redirect(500, CLIENT_URL);
    }

    // ===== RETURN ERROR PROMPTING EMAIL VERIFICATION =====
    if (!userInfo.verified_email) {
        res.cookie(
            "google.error",
            "You must verify your google account before logging in with google",
            { secure: true, httpOnly: false, signed: true }
        )
        return res.redirect(401, CLIENT_URL);
    }

    // ===== GET USER FROM DB USING GOOGLE ID =====
    const google_user: any = await UserSchema.findOne({ googleId: userInfo.id });
    // console.log("Google User:", google_user);

    // ===== GET USER FROM DB USING EMAIL =====
    const basic_user: any = (google_user === null) && await UserSchema.findOne({ email: userInfo.email });
    // console.log("Basic User:", basic_user);

    // ===== USER INFO TO CREATE OR UPDATE USER WITH =====
    const update_user_info = {
        googleId: userInfo.id,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        photo: userInfo.picture,
        verified: userInfo.verified_email,
    };

    // ===== SET COOKIES WITH TOKENS =====
    res.cookie("google.rToken", tokens.refresh_token, cookie_options);
    res.cookie("google.aToken", tokens.access_token, {...cookie_options, httpOnly: false});

    // ========== UPDATE OR CREATE USER ==========
    if (google_user !== null) {
    // ===== UPDATE USER INFO =====
        /* Why only update "verified" property?
            The reason I"m not updating any other info is because the user may have manually
            changed this information and doesn"t want to update their info with google user 
            info every time they log in using google.

            Instead, include a "sync with google" button on the client side to update manually
        */
        google_user.updateOne({verified: userInfo.verified_email}, async (err: any, doc: any) => {
            if (err) {
                console.error(err);
                return res.redirect(500, CLIENT_URL);
            }
            const newTokens = await updateOrCreateToken(google_user, tokens);
            console.log("Google Callback:", newTokens)
        });
    } else if (basic_user !== null) {
    // ===== UPDATE BASIC USER WITH GOOGLE ID =====
        basic_user.password = undefined;
        basic_user.save()
        basic_user.updateOne(update_user_info, async (err: any, doc: any) => {
            if (err) {
                console.error(err);
                return res.redirect(500, CLIENT_URL);
            }
            const newTokens = await updateOrCreateToken(basic_user, tokens);
            console.log("Basic Callback:", newTokens)
        });
    } else {
    // ===== CREATE USER =====
        let username = await generateUsername2();    

        // ===== CREATE USER =====
        try {
            const newUser = new UserSchema({
                ...update_user_info,
                email: userInfo.email,
                username: username,
            });
            await newUser.save();
            const newTokens = await updateOrCreateToken(newUser, tokens);
            // console.log("New User Tokens:", newTokens);
        } catch(e: any) {
            console.error(e);
            return res.redirect(500, CLIENT_URL);
        }
    }

    return res.redirect(CLIENT_URL);
});

router.get("/me", async (req: any, res) => {
    const { signedCookies: cookies } = req;
    const refresh_token = cookies["google.rToken"];
    if (!refresh_token) return res.status(401).json({ error: "No refresh token found" });

    const authHeader = req.headers["authorization"];
    let access_token = authHeader && authHeader.split(" ")[1];
    if (access_token == null) {
        try {
            const tokens = await getTokens(refresh_token);
            const userInfo = await getUserInfo(tokens);
            return res.status(200).json(userInfo);
        } catch(e: any) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    } else {
        const tokens = { access_token: access_token, refresh_token: refresh_token };
        try{
            const userInfo = await getUserInfo(tokens);
            if (!userInfo) return res.status(500).json({ error: "Unable to retrieve user info" })
            return res.status(200).json({ user_info: userInfo });
        } catch(e: any) {
            console.error(e);
            return res.status(500).json({ error: e.message });
        }
    }
});

export default router;