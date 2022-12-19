import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

function log(msg: any) {
    if (env.NODE_ENV !== 'test') {
        console.log(msg);
    }
}

const ERRORS = {
    EXPIRED_SESSION: "Your session has expired, please login again",
    NOT_USER: "Only the owner of this account can perform this action",
    NOT_OWNER: "Only the owner or a superuser can perform this action",
    NOT_ADMIN: "Only an administrator or a superuser can perform this action",
    NOT_SUPERUSER: "Only a superuser can perform this action",
    NOT_ADMIN_OR_OWNER: "Only the owner, an administrator or a superuser can perform this action",
}

const MSG_TYPES = {
    ERROR: "error",
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
}



export { MSG_TYPES, ERRORS, log };