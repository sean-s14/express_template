const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateFromEmail, generateUsername } = require("unique-username-generator");

const UserSchema = require("../schemas/user");
const TokenSchema = require("../schemas/token");
const { generateAccessToken, generateRefreshToken } = require("../utils/auth/tokens");
const { MSG_TYPES } = require('../utils/messageTypes');

// router.use((req, res, next) => {
//     console.log("Request Body:", req?.body);
//     next()
// })

// =============== SIGNUP ===============
router.post("/signup", async (req, res) => {
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
        username = generateFromEmail(email, 5);
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
    } catch(e) {
        console.log(e);
        return res.status(500).json(e.errors)
    }

    return res.status(201).json({ [MSG_TYPES.SUCCESS]: "Your account has been created" })
})

// =============== LOGIN ===============
router.post("/login", async (req, res) => {
    // TODO: Search through database for user with specified username/email and then match password 
    const { username, password } = req.body;

    const user = await UserSchema.findOne({ username: username });
    if (!user) return res.status(404).json("User with specified username could not be found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(403).json("Password entered is invalid");

    const user2 = { username: username, id: user._id, role: user.role };
    const accessToken = generateAccessToken(user2);
    const refreshToken = generateRefreshToken(user2);

    try {
        // console.log("Refresh Token:", refreshToken);
        // console.log("User ID:", user._id);
        const tokenInDB = await TokenSchema.findOne({ user: user._id })
        // console.log("Token in DB:", tokenInDB);
        if (!tokenInDB) {
            const token = new TokenSchema({
                token: refreshToken,
                user: user._id,
            })
            await token.save();
        } else {
            // console.log("Updating schema...")
            const token = await TokenSchema.findOneAndUpdate(
                { user: user._id },
                { token: refreshToken },
            )
        }
    } catch(e) {
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
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.signedCookies;
    // console.log("Signed Cookie:", refreshToken);

    if (refreshToken == null) return res.status(401).json({[MSG_TYPES.ERROR]:"No refresh token found in cookie"});

    const refreshTokenInDB = await TokenSchema.findOne({ token: refreshToken });
    if (!refreshTokenInDB) return res.status(403).json({ [MSG_TYPES.ERROR]: "Could not find refresh token in database" });
    // if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
        if (err) return res.status(403).json({[MSG_TYPES.ERROR]:"Unable to verify refresh token"});
        const accessToken = generateAccessToken({ username: user.username });
        // Replace old refresh token
        // deleteRefreshToken(req)

        const newRefreshToken = generateRefreshToken({ username: user.username });
        // refreshTokens.push(refreshToken);
        try {
            const token = await TokenSchema.findOneAndUpdate(
                { token: refreshToken},
                { token: newRefreshToken },
            )
            // console.log("Token:", token);
        } catch(e) {
            console.log(e);
            return res.status(500).json(e.errors);
        }

        res.cookie("refreshToken", newRefreshToken, { httpOnly: true, signed: true });
        // Return 2 new tokens
        return res.json({ accessToken: accessToken }) // , refreshToken: newRefreshToken });
    })
})

// =============== LOGOUT ===============
router.delete("/logout", async (req, res) => {
    const { refreshToken } = req.signedCookies;
    if (refreshToken) {
        res.clearCookie("refreshToken", { httpOnly: true, signed: true });
    }
    try {
        const token = await TokenSchema.findOneAndDelete({ token: refreshToken });
        if (token === null) {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "Unable to log out" })
        }
        return res.status(204);
    } catch(e) {
        console.log(e);
        return res.status(500).json(e.errors);
    }
})

module.exports = router