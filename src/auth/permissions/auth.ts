import { ROLES } from "./roles";
import { ITokenUser } from "../utils/auth";
import { IUser } from "../schemas/user";


/**
 * Returns true if the user is the owner of the account
 */
function isUser(user: ITokenUser | IUser | undefined, userId: string) {
    return (user?._id.toString() === userId);
}

/**
 * Returns true if the user is an admin or a superuser
 */
function isAdmin(user: ITokenUser | IUser | undefined) {
    return (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERUSER);
};

/**
 * Returns true if the user is a superuser
 */
function isSuperuser(user: ITokenUser | IUser | undefined) {
    return (user?.role === ROLES.SUPERUSER);
};

/**
 * Returns true if the user is the owner of the account, an admin or a superuser
 */
function isUserOrAdmin(user: ITokenUser | IUser | undefined, userId: string) {
    return (
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        user?._id.toString() === userId
    );
};

/**
 * Returns true if the user is the owner of the account or a superuser
 */
function isUserOrSuperuser(user: ITokenUser | IUser | undefined, userId: string) {
    return (user?.role === ROLES.SUPERUSER || user?._id.toString() === userId);
};

export {
    isUser,
    isAdmin,
    isSuperuser,

    isUserOrAdmin,
    isUserOrSuperuser,
};