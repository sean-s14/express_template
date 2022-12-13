import { ROLES } from "./roles";
// import { IUser } from "../../schemas/user";

interface IUser {
    id?: string,
    role?: string,
}

/**
 * Returns true if the user is the owner of the account
 */
function isUser(user: IUser | undefined, userId: string) {
    return (user?.id === userId);
}

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
function isUserOrAdmin(user: IUser | undefined, userId: string) {
    return (
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        user?.id === userId
    );
};

/**
 * Returns true if the user is the owner of the account or a superuser
 */
function isUserOrSuperuser(user: IUser | undefined, userId: string) {
    return (user?.role === ROLES.SUPERUSER || user?.id === userId);
};

export {
    isUser,
    isAdmin,
    isSuperuser,

    isUserOrAdmin,
    isUserOrSuperuser,
};