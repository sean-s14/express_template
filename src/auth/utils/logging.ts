const ERRORS = {
    NOT_ADMIN: "Only an administrator can perform this action",
    NOT_OWNER: "Only the owner of this object can perform this action",
    NOT_ADMIN_OR_OWNER: "Only the owner of this object or an administrator can perform this action"
}

const MSG_TYPES = {
    ERROR: "error",
    SUCCESS: "success",
    INFO: "info",
    WARNING: "warning",
}

export { MSG_TYPES, ERRORS };