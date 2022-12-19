import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import express from "express";
const router = express.Router();

import { User as UserSchema } from "../../../schemas/user";
import { Token as TokenModel } from "../../../schemas/token";
import { authenticateToken, checkAuthPermissions } from "../../../middleware/auth";
import { ERRORS, MSG_TYPES, log } from "../../../utils/logging";
import { Request } from "../types";

// ========== GET USER ==========
router.get("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const username = user?.username;
    const projection = "verified _id role username email createdAt updatedAt photo";

    try {
        if (username) {
            const userObj = await UserSchema.findOne({ username: username }, projection);
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: `User with username "${username}" could not be found` });
            } else {
                return res.status(200).json(userObj);
            }
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username attached to access token" })
        } 
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== UPDATE USER ==========
router.patch("/", authenticateToken, checkAuthPermissions, async (req: Request, res: express.Response) => {
    const { user, body } = req;
    const username = user?.username;
    const update_options = { new: true, lean: true, runValidators: true }

    try {
        if (username) {
            const userObj = await UserSchema.findOneAndUpdate(
                { username: username },
                body,
                update_options,
            );
            delete userObj?.password;
            delete userObj?.__v;
            return res.status(200).json(userObj);
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username attached to access token" })
        }
    } catch(e: any) {
        log(e);
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

// ========== DELETE USER ==========
router.delete("/", authenticateToken, async (req: Request, res: any) => {
    const { user } = req;
    const username = user?.username;

    try {
        if (username) {
            const userObj = await UserSchema.findOneAndDelete({ username: username });
            if (userObj === null) {
                return res.status(404).json(
                    { [MSG_TYPES.ERROR]: `The account with username ${username} does not exist` }
                );
            } else {
                await TokenModel.findOneAndDelete({ user: userObj._id });
            }
        } else {
            return res.status(400).json({ [MSG_TYPES.ERROR]: "There was no username attached to access token" });
        }
        return res.status(200).json({ success: "Your account has successfully been deleted" });
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.errors);
    }
});

export default router;