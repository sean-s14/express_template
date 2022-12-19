import { ROLES } from "../auth/permissions/roles";
import { I_Item } from "../schemas/item";
import { ITokenUser } from "../auth/utils/auth";

/**
 * Returns true if the user is the owner of the object
 */
 function isOwnerOfObj(user: ITokenUser | undefined, item: I_Item) {
    return (user?._id.toString() === item?.userId?.toString());
};

/**
 * Returns true if the user is the owner of the object or is either an admin or a superuser
 */
 function isOwnerOfObjOrAdmin(user: ITokenUser | undefined, item: I_Item) {
    return ( 
        user?.role === ROLES.ADMIN || 
        user?.role === ROLES.SUPERUSER || 
        item?.userId?.toString() === user?._id.toString()
    );
};

/**
 * Returns true if the user is the owner of the object or a superuser
 */
function isOwnerOfObjOrSuperuser(user: ITokenUser | undefined, item: I_Item) {
    return ( user?.role === ROLES.SUPERUSER || item?.userId?.toString() === user?._id.toString());
};


export {
    isOwnerOfObj,
    isOwnerOfObjOrAdmin,
    isOwnerOfObjOrSuperuser,
};