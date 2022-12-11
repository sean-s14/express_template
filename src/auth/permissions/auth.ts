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

/**
 * Returns true if the user is the owner of the account
 */
function isUser(user: IUser | undefined, userId: string) {
    return (user?.id === userId);
}

/**
 * Returns true if the user is the owner of the object
 */
function isOwner(user: IUser | undefined, item: IItem) {
    return (user?.id === item?.userId?.toString());
};

/**
 * Returns true if the user is an admin or a superuser
 */
function isAdmin(user: IUser | undefined) {
    return (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERUSER);
};

/**
 * Returns true if the user is a superuser
 */
function isSuperuser(user: IUser | undefined) {
    return (user?.role === ROLES.SUPERUSER);
};

/**
 * Returns true if the user is the owner of the account, an admin or a superuser
 */
function isOwnerOrAdmin(user: IUser | undefined, userId: string) {
    return (
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        user?.id === userId
    );
};

function isOwnerOfObjOrAdmin(user: IUser | undefined, item: IItem) {
    return ( 
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        item?.userId?.toString() === user?.id
    );
};

/**
 * Returns true if the user is the owner of the account or a superuser
 */
function isOwnerOrSuperuser(user: IUser | undefined, userId: string) {
    return (user?.role === ROLES.SUPERUSER || user?.id === userId);
};

function isOwnerOfObjOrSuperuser(user: IUser | undefined, item: IItem) {
    return ( user?.role === ROLES.SUPERUSER || item?.userId?.toString() === user?.id);
};

export {
    isUser,
    isOwner,
    isAdmin,
    isSuperuser,

    isOwnerOrAdmin,
    isOwnerOrSuperuser,
    
    isOwnerOfObjOrAdmin,
    isOwnerOfObjOrSuperuser,
};