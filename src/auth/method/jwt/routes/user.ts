import express from "express";
const router = express.Router();

import { User as UserSchema } from "../../../schemas/user";
import { authenticateToken, checkPermissions } from "../../../middleware/auth";
import { isAdmin, isSuperuser } from "../../../permissions/auth";
import { ERRORS, MSG_TYPES } from "../../../utils/logging";
import { Request } from "../types";

// ========== GET USER ==========
router.get("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const username = user?.username;
    const email = user?.email;
    const projection = "verified _id role username email createdAt updatedAt";

    try {
        if (username) {
            const userObj = await UserSchema.findOne({ username: username }, projection);
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: `User with username "${username}" could not be found` });
            } else {
                return res.status(200).json(userObj);
            }
        } else if (email) {
            const userObj = await UserSchema.findOne({ email: email }, projection);
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: `User with email "${email}" could not be found` });
            } else {
                return res.status(200).json(userObj);
            }
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username or email attached to access token" })
        } 
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== UPDATE USER ==========
router.patch("/", authenticateToken, checkPermissions, async (req: Request, res: express.Response) => {
    const { user, body } = req;
    const username = user?.username;
    const email = user?.email;

    try {
        if (username) {
            const userObj = await UserSchema.findOneAndUpdate(
                { username: username },
                body,
                { new: true, lean: true },
            );
            delete userObj?.password;
            delete userObj?.__v;
            return res.status(200).json(userObj);
        } else if (email) {
            const userObj = await UserSchema.findOneAndUpdate(
                { email: email },
                body,
                { new: true, lean: true },
            );
            delete userObj?.password;
            delete userObj?.__v;
            return res.status(200).json(userObj);
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username or email attached to access token" })
        }
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== DELETE USER ==========
router.delete("/", authenticateToken, async (req: Request, res: any) => {
    const { user } = req;
    const username = user?.username;
    const email = user?.email;

    try {
        if (username) {
            const userObj = await UserSchema.findOneAndDelete({ username: username });
            if (userObj === null) {
                return res.status(400).json(
                    { [MSG_TYPES.ERROR]: `The account with username ${username} does not exist` }
                );
            }
        } else if (email) {
            const userObj = await UserSchema.findOneAndDelete({ email: email });
            if (userObj === null) {
                return res.status(400).json(
                    { [MSG_TYPES.ERROR]: `The account with email ${email} does not exist` }
                );
            }
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username or email attached to access token" });
        }
        return res.status(200).json({ success: "Your account has successfully been deleted" });
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

export default router;