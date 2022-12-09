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

function isOwner(user: IUser | undefined, item: IItem) {
    return (user?.id === item?.userId?.toString());
};

function isAdmin(user: IUser | undefined) {
    return (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERUSER);
};

function isSuperuser(user: IUser | undefined) {
    return (user?.role === ROLES.SUPERUSER);
};

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

function isOwnerOrSuperuser(user: IUser | undefined, userId: string) {
    return (user?.role === ROLES.SUPERUSER || user?.id === userId);
};

function isOwnerOfObjOrSuperuser(user: IUser | undefined, item: IItem) {
    return ( user?.role === ROLES.SUPERUSER || item?.userId?.toString() === user?.id);
};

export {
    isOwner,
    isAdmin,
    isSuperuser,

    isOwnerOrAdmin,
    isOwnerOrSuperuser,
    
    isOwnerOfObjOrAdmin,
    isOwnerOfObjOrSuperuser,
};