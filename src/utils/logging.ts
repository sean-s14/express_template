import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

function log(msg: any) {
    if (env.NODE_ENV !== 'test') {
        console.log(msg);
    }
}

const MSG_TYPES = {
    ERROR: "error",
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
}

const ITEM_ERRORS = {
    NOT_OWNER: "Only the owner of this item can perform this action",
    NOT_ADMIN: "Only an administrator or a superuser can perform this action",
    NOT_SUPERUSER: "Only a superuser can perform this action",
    NOT_OWNER_OR_ADMIN: "Only the owner of this item, an administrator or a superuser can perform this action",
    NOT_OWNER_OR_SUPERUSER: "Only the owner of this item or a superuser can perform this action",
}

export { MSG_TYPES, ITEM_ERRORS, log };