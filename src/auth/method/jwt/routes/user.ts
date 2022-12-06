import express from "express";
const router = express.Router();

import { User as UserSchema } from "../../../schemas/user";
import { authenticateToken } from "../../../middleware/auth";
import { isAdmin } from "../../../permissions/auth";
import { ERRORS } from "../../../utils/logging";
import { Request } from "../types";

// ========== GET USER ==========
router.get("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const username = user?.username;
    const email = user?.email;
    const projection = "verified _id role username email createdAt updatedAt";

    try {
        if (username) {
            var userObj = await UserSchema.findOne({ username: username }, projection);
            if (userObj === null) {
                return res.status(404).json({ error: `User with username "${username}" could not be found` });
            } else {
                return res.status(200).json(userObj);
            }
        } else if (email) {
            var userObj = await UserSchema.findOne({ email: email }, projection);
            if (userObj === null) {
                return res.status(404).json({ error: `User with email "${email}" could not be found` });
            } else {
                return res.status(200).json(userObj);
            }
        } else {
            return res.status(400).json({ error: "There was no username or email attached to access token" })
        } 
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== UPDATE USER ==========
router.patch("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user, body } = req;

    if (body.hasOwnProperty("role") && !isAdmin(user)) {
        return res.status(403).send({"error": ERRORS.NOT_ADMIN});
    }

    try {
        const userObj = await UserSchema.findOneAndUpdate(
            { username: user?.username },
            body,
            { new: true },
        );
        return res.status(200).json(userObj);
        // return res.status(200).json({ "msg": "Testing" });
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== DELETE USER ==========
router.delete("/", authenticateToken, async (req: Request, res: any) => {
    const { user } = req;

    try {
        const userObj = await UserSchema.findOneAndDelete({ username: user?.username });
        if (userObj === null) {
            return res.status(400).json(
                { "msg": `The account with username ${user?.username} does not exist` }
            );
        }
        return res.status(200).json({ "msg": "Your account has successfully been deleted" });
    } catch(e: any) {
        console.log(e)
        return res.status(500).json(e.errors);
    }
});

export default router;