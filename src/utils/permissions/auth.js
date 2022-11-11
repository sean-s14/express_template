import { ROLES } from "./roles.js";

function isAdmin(user) {
    return (user.role === ROLES.ADMIN);
};

function isOwner(user, item) {
    return (user.id === item.userId.toString());
};

// This is for users only
function isOwnerOrAdmin(user, userId) {
    return (user.role === ROLES.ADMIN || user.id === userId);
};

function isOwnerOfObjOrAdmin(user, item) {
    return ( user.role === ROLES.ADMIN || item.userId.toString() === user.id);
};

// function isAdmin(req, res, next) {
//     if (req.user.role !== ROLES.ADMIN) {
//         return res.status(403).send("Only an administrator can perform this action");
//     }
//     next();
// }

// function isOwnerOrAdmin(req, res, next) {
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