interface IResponses {
    [key: string]: string
}

const RAW_RESPONSES: IResponses = {
	SUCCESS: "200 success",
	BAD_REQUEST: "400 bad request",
	UNAUTHORIZED: "401 unauthorized",
	FORBIDDEN: "403 forbidden",
	NOT_FOUND: "404 not found",
	SERVER_ERROR: "500 server error",
}

const RESPONSES = Object.fromEntries(Object.entries(RAW_RESPONSES).map( arr => {
    arr[1] = `Response: ${arr[1]}`;
    return arr;
}))


export { RESPONSES };