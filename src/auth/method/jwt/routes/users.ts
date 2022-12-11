import express from "express";
const router = express.Router();

import { User as UserSchema } from "../../../schemas/user";
import { authenticateToken, checkPermissions } from "../../../middleware/auth";
import { isAdmin, isUser, isOwnerOrAdmin, isOwnerOrSuperuser, isSuperuser } from "../../../permissions/auth";
import { ERRORS, MSG_TYPES, log } from "../../../utils/logging";
import { Request } from "../types";

// ========== GET ALL USERS ==========
router.get("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;

    try {
        if (isAdmin(user)) {
            const allUsers = await UserSchema.find();
            return res.status(200).json(allUsers);
        } else {
            const allUsers = await UserSchema.find({}, "username createdAt");
            return res.status(200).json(allUsers);
        }
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.errors);
    }
});

// ========== GET USER ==========
router.get("/:id", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const userId = req.params.id;

    try {
        if (isOwnerOrAdmin(user, userId)) {
            const userObj = await UserSchema.findById(userId);
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Could not find user with specified ID" });
            }
            return res.status(200).json(userObj);
        } else {
            const userObj = await UserSchema.findById(userId, "username createdAt");
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Could not find user with specified ID" });
            }
            return res.status(200).json(userObj);
        }
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.message);
    }
});

// ========== UPDATE USER ==========
router.patch("/:id", authenticateToken, checkPermissions, async (req: Request, res: express.Response) => {
    const { user, body } = req;
    const userId = req.params.id;
    const update_options = { new: true, lean: true, runValidators: true }

    if (!isOwnerOrAdmin(user, userId)) {
        return res.status(403).json({ [MSG_TYPES.ERROR]: ERRORS.NOT_ADMIN_OR_OWNER});
    }

    try {
        const userObj = await UserSchema.findOneAndUpdate(
            { username: user?.username },
            body,
            update_options,
        );
        return res.status(200).json(userObj);
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.message);
    }
});

// ========== DELETE USER ==========
router.delete("/:id", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const userId = req.params.id;

    if (!isOwnerOrAdmin(user, userId)) {
        return res.status(403).send({ [MSG_TYPES.ERROR]: ERRORS.NOT_ADMIN_OR_OWNER });
    }

    try {
        const userObj = await UserSchema.findById(userId);
        if (userObj === null) {
            return res.status(404).json(
                { [MSG_TYPES.ERROR]: `The account with ID ${userId} does not exist` }
            );
        } else {
            if (isSuperuser(userObj)) {
                if (isUser(user, userObj?._id.toString())) {
                    await UserSchema.findByIdAndDelete(userId);
                } else {
                    res.status(403).json({ [MSG_TYPES.ERROR]: ERRORS.NOT_USER})
                }
            } else if (isAdmin(userObj)) {
                if (isOwnerOrSuperuser(user, userId)) {
                    await UserSchema.findByIdAndDelete(userId);
                } else {
                    res.status(403).json({ [MSG_TYPES.ERROR]: ERRORS.NOT_OWNER})
                }
            } else {
                await UserSchema.findByIdAndDelete(userId);
            }
        }

        return res.status(200).json(
            { [MSG_TYPES.SUCCESS]: `The account with ID ${userId} has been successfully been deleted` }
        );
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.message);
    }
});

export default router;