import mongoose from "mongoose";
import { ROLES } from "./roles";
// import { IUser } from "../../schemas/user";

interface IUser {
    id?: string,
    role?: string,
}

interface IItem {
    userId: mongoose.Types.ObjectId,
}

function isAdmin(user: IUser | undefined) {
    return (user?.role === ROLES.ADMIN);
};

function isOwner(user: IUser | undefined, item: IItem) {
    return (user?.id === item?.userId?.toString());
};

// This is for users only
function isOwnerOrAdmin(user: IUser | undefined, userId: string) {
    return (user?.role === ROLES.ADMIN || user?.id === userId);
};

function isOwnerOfObjOrAdmin(user: IUser | undefined, item: IItem) {
    return ( user?.role === ROLES.ADMIN || item?.userId?.toString() === user?.id);
};

// function isAdmin(req: express.Request, res, next) {
//     if (req.user.role !== ROLES.ADMIN) {
//         return res.status(403).send("Only an administrator can perform this action");
//     }
//     next();
// }

// function isOwnerOrAdmin(req: express.Request, res, next) {
//     const { user } = req;
//     const userId = req.params.id;
//     // console.log("Request:", req);
//     if ( user.role === ROLES.ADMIN || user.id === userId) {
//         next();
//     } else {
//         return res.status(403).send("Only the owner of this account or an administrator can perform this action");
//     }
// };

// function isOwnerOrAdminOfObj(user, item) {
//     // console.log("Request:", req);
//     if ( user.role === ROLES.ADMIN || item.userId === user.id) {
//         next();
//     } else {
//         return res.status(403).send("Only the owner of this object or an administrator can perform this action");
//     }
// };

export {
    isAdmin,
    isOwner,
    isOwnerOrAdmin,
    isOwnerOfObjOrAdmin,
};