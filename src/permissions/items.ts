

import { ROLES } from "../auth/permissions/roles";
import { I_Item } from "../schemas/item";

interface IUser {
    id?: string,
    role?: string,
}

/**
 * Returns true if the user is the owner of the object
 */
 function isOwnerOfObj(user: IUser | undefined, item: I_Item) {
    return (user?.id === item?.userId?.toString());
};

/**
 * Returns true if the user is the owner of the object or is either an admin or a superuser
 */
 function isOwnerOfObjOrAdmin(user: IUser | undefined, item: I_Item) {
    return ( 
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        item?.userId?.toString() === user?.id
    );
};

/**
 * Returns true if the user is the owner of the object or a superuser
 */
function isOwnerOfObjOrSuperuser(user: IUser | undefined, item: I_Item) {
    return ( user?.role === ROLES.SUPERUSER || item?.userId?.toString() === user?.id);
};


export {
    isOwnerOfObj,
    isOwnerOfObjOrAdmin,
    isOwnerOfObjOrSuperuser,
};