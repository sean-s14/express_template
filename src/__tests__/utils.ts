
interface I_ITEM_PATHS {
    [key: string]: string
}

let ITEM_PATHS: I_ITEM_PATHS = {
	CREATE: "POST /items/",
	GET_ONE: "GET /items/:id",
	GET_ALL: "GET /items/all",
	GET_ALL_FOREIGN: "GET /items/all/:id",
	UPDATE_ONE: "PATCH /items/:id",
	DELETE_ONE: "DELETE /items/:id",
}

interface IROUTES {
    [key: string]: string
}

let ROUTES: IROUTES = {
	CREATE: "/items/",
	GET_ONE: "/items/:id",
	GET_ALL: "/items/",
	GET_ALL_FOREIGN: "/items/:id",
	UPDATE_ONE: "/items/:id",
	DELETE_ONE: "/items/:id",
}

export {
    ITEM_PATHS,
    ROUTES
}