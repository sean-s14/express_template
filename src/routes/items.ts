import express from "express";
const router = express.Router();

import { I_Item, Item as ItemModel } from "../schemas/item";
import { IUser, User as UserModel } from "../auth/schemas/user";
import { authenticateToken } from "../auth/middleware/auth";
import { ITEM_ERRORS, MSG_TYPES, log } from "../utils/logging";
import { isAdmin, isSuperuser } from "../auth/permissions/auth";
import { isOwnerOfObj } from "../permissions/items";

// middleware that is specific to this router
// router.use((req: any, res: express.Response, next: Function) => {
//     console.log("Request:", req);
//     next()
// })

// TODO: Improve documentation for this function
/**
 * Compares role of user and itemOwner and returns true if user permission level is higher and false otherwise
 * 
 * Returns `[true, null]` if the user is authorized to get/update/delete an item(s)
 * 
 * Returns `[false, error_message]` if the user is NOT authorized to get/update/delete an item(s)
 */
function isUserAuthorized(user: any, item: I_Item | null, itemOwner: IUser): [boolean, string | null] {
    
    const check = (): [boolean, string | null] => {
        return isSuperuser(itemOwner)
                    ? [false, ITEM_ERRORS.NOT_OWNER]
                : isAdmin(itemOwner)
                    ? isSuperuser(user)
                        ? [true, null]
                        : [false, ITEM_ERRORS.NOT_OWNER_OR_SUPERUSER]
                : isAdmin(user)
                    ? [true, null]
                    : [false, ITEM_ERRORS.NOT_OWNER_OR_ADMIN]
    }

    if (item === null) {
        return check();
    } else {
        return isOwnerOfObj(user, item)
                ? [true, null]
                : check()
    }
}

// =============== CREATE ITEM ===============
router.post("/", authenticateToken, async (req: any, res: express.Response) => {
    const { user, body } = req;

    try {
        const item = new ItemModel({ ...body, userId: user._id });
        await item.save();
        return res.status(201).json(item);
    } catch(e: any) {
        log(e);
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message })
    }
});

// =============== GET ALL ITEMS ===============
router.get("/all", authenticateToken, async (req: any, res: express.Response) => {
    const { user } = req;

    try {
        const allItems = await ItemModel.find({ userId: user._id });
        return res.status(200).json(allItems);
    } catch(e: any) {
        log(e)
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

// =============== GET ALL ITEMS OF ANOTHER USER ===============
router.get("/all/:id", authenticateToken, async (req: any, res: express.Response) => {
    const { user } = req;
    const { id } = req.params;

    try {
        let allItems: I_Item[];
        let itemsOwner: IUser | null;
        let userAuthorized: [boolean, string | null] | null;

        { // ===== GET ITEMS =====
            allItems = await ItemModel.find({ userId: id });
            if (allItems.length === 0) {
                return res.status(404).json({ 
                    [MSG_TYPES.ERROR]: "Items belonging to requested user could not be found"
                })
            }
        }

        { // ===== IS USER OWNER =====
            if (user._id === id) {
                return res.status(200).json(allItems);
            }
        }

        { // ===== GET ITEMS OWNER =====
            itemsOwner = await UserModel.findById(id);
            if (itemsOwner === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Owner of requested items could not be found" })
            }
        }

        { // ===== IS USER AUTHORIZED ===== 
            userAuthorized = isUserAuthorized(user, null, itemsOwner);
            if (userAuthorized[0]) {
                return res.status(200).json(allItems);
            } else {
                return res.status(401).json({ [MSG_TYPES.ERROR]: userAuthorized[1] });
            }
        }

    } catch(e: any) {
        log(e)
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

// =============== GET ITEM ===============
router.get("/:id", authenticateToken, async (req: any, res: express.Response) => {
    const { user } = req;
    const { id } = req.params;

    try {
        let item: I_Item | null;
        let itemOwner: IUser | null;
        let userAuthorized: [boolean, string | null] | null;

        { // ===== GET ITEM =====
            item = await ItemModel.findOne({ _id: id });
            if (item === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Item could not be found" });
            }
        }

        { // ===== IS USER OWNER =====
            if (isOwnerOfObj(user, item)) {
                return res.status(200).json(item);
            }
        }
        
        { // ===== GET ITEM OWNER =====
            itemOwner = await UserModel.findById(item.userId);
            if (itemOwner === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "User could not be found" });
            }
        }

        { // ===== IS USER AUTHORIZED =====
            userAuthorized = isUserAuthorized(user, null, itemOwner);
            if (userAuthorized[0]) {
                return res.status(200).json(item);
            } else {
                return res.status(401).json({[MSG_TYPES.ERROR]: userAuthorized[1] });
            }
        }

        { // TODO: Return _id, title, userId & createdAt if user is basic user and not owner
            //     let itemLimited = {
            //         _id: item._id,
            //         title: item.title,
            //         userId: item.userId,
            //         createdAt: item.createdAt,   
            //     }
            //     return res.status(200).json(itemLimited);
        }
    } catch(e: any) {
        log(e)
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

// =============== UPDATE ITEM ===============
router.patch("/:id", authenticateToken, async (req: any, res: express.Response) => {
    const { user, body } = req;
    const { id } = req.params;

    // TODO: Prevent certain attributes from being updated based on authorization level

    try {
        let item: I_Item | null;
        let itemOwner: IUser | null;
        let userAuthorized: [boolean, string | null] | null;

        { // ===== GET ITEM =====
            item = await ItemModel.findOne({ _id: id });
            if (item === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Item could not be found" });
            }
        }
        
        { // ===== GET ITEM OWNER =====
            itemOwner = await UserModel.findById(item.userId);
            if (itemOwner === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "User could not be found" });
            }
        }
        
        { // ===== IS USER AUTHORIZED =====
            userAuthorized = isUserAuthorized(user, item, itemOwner);
            if (userAuthorized[0]) {
                const itemUpdated = await ItemModel.findOneAndUpdate(
                    { _id: id }, 
                    body, 
                    { new: true, runValidators: true }
                );
                return res.status(200).json(itemUpdated);
            } else {
                return res.status(401).json({ [MSG_TYPES.ERROR]: userAuthorized[1] });
            }
        }
    } catch(e: any) {
        log(e)
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

// =============== DELETE ITEM ===============
router.delete("/:id", authenticateToken, async (req: any, res: express.Response) => {
    const { user } = req;
    const { id } = req.params;

    try {
        let item: I_Item | null;
        let itemOwner: IUser | null;
        let userAuthorized: [boolean, string | null] | null;

        { // ===== GET ITEM =====
            item = await ItemModel.findOne({ _id: id });
            if (item === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "Item could not be found" });
            }
        }
        
        { // ===== GET ITEM OWNER =====
            itemOwner = await UserModel.findById(item.userId);
            if (itemOwner === null) {
                return res.status(404).json({ [MSG_TYPES.ERROR]: "User could not be found" });
            }
        }
        
        { // ===== IS USER AUTHORIZED =====
            userAuthorized = isUserAuthorized(user, item, itemOwner);
            if (userAuthorized[0]) {
                await ItemModel.findOneAndDelete({ _id: id });
                return res.status(200).json({ [MSG_TYPES.SUCCESS]: `The item titled ${item.title} has been deleted` });
            } else {
                return res.status(401).json({ [MSG_TYPES.ERROR]: userAuthorized[1] });
            }
        }
    } catch(e: any) {
        console.log(e)
        return res.status(500).json({ [MSG_TYPES.ERROR]: e.message });
    }
});

export default router;