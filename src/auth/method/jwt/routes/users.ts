import express from "express";
const router = express.Router();

import { User as UserModel, IUser } from "../../../schemas/user";
import { authenticateToken, checkPermissions } from "../../../middleware/auth";
import { isAdmin, isUser, isOwnerOrAdmin, isOwnerOrSuperuser, isSuperuser } from "../../../permissions/auth";
import { ERRORS, MSG_TYPES, log } from "../../../utils/logging";
import { Request } from "../types";

function isUserUnauthorized(user: any, userObj: IUser): (string | boolean)[] {
    if (!isUser(user, userObj?._id.toString())) { 
        // CLIENT IS NOT REQUESTED USER
        if (isSuperuser(userObj)) { 
            // REQUESTED USER IS A SUPERUSER
            return [true, ERRORS.NOT_USER];
        } else if (isAdmin(userObj)) { 
            // REQUESTED USER IS AN ADMIN
            if (!isSuperuser(user)) { 
                // CLIENT IS NOT A SUPERUSER
                return [true, ERRORS.NOT_OWNER];
            }
        } else { 
            // REQUESTED USER IS A BASIC USER
            if (!isAdmin(user)) { 
                // CLIENT IS NOT AN ADMIN OR SUPERUSER
                return [true, ERRORS.NOT_ADMIN_OR_OWNER];
            }
        }
    }
    return [false, "authorized"];
}

// ========== GET ALL USERS ==========
router.get("/", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;

    try {
        if (isAdmin(user)) {
            const allUsers = await UserModel.find();
            return res.status(200).json(allUsers);
        } else {
            const allUsers = await UserModel.find({}, "username createdAt");
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
            const userObj = await UserModel.findById(userId);
            if (userObj === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Could not find user with specified ID" });
            }
            return res.status(200).json(userObj);
        } else {
            const userObj = await UserModel.findById(userId, "username createdAt");
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

    try {
        const userObj = await UserModel.findById(userId)
        if (userObj === null) { 
            // NOT FOUND
            return res.status(404).json({ [MSG_TYPES.ERROR]: "Could not find user with specified ID" });
        } else { 
            // FOUND
            let isAnauthorized = isUserUnauthorized(user, userObj); 
            if (isAnauthorized[0]) {
                return res.status(401).json({ [MSG_TYPES.ERROR]: isAnauthorized[1] });
            }

            const newUserObj = await UserModel.findByIdAndUpdate(userId, body, update_options);
            return res.status(200).json(newUserObj);
        }

    } catch(e: any) {
        log(e)
        return res.status(500).json(e.message);
    }
});

// ========== DELETE USER ==========
router.delete("/:id", authenticateToken, async (req: Request, res: express.Response) => {
    const { user } = req;
    const userId = req.params.id;

    try {
        const userObj = await UserModel.findById(userId);
        if (userObj === null) { 
            // NOT FOUND
            return res.status(404).json({[MSG_TYPES.ERROR]:`The account with ID ${userId} does not exist`});
        } else { 
            // FOUND
            let isAnauthorized = isUserUnauthorized(user, userObj); 
            if (isAnauthorized[0]) {
                return res.status(401).json({ [MSG_TYPES.ERROR]: isAnauthorized[1] });
            }

            await UserModel.findByIdAndDelete(userId);
            return res.status(200).json(
                { [MSG_TYPES.SUCCESS]: `The account with ID ${userId} has been successfully been deleted` }
            );
        }
    } catch(e: any) {
        log(e)
        return res.status(500).json(e.message);
    }
});

export default router;