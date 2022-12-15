import { expect } from "chai";
import request from "supertest";
import bcrypt from "bcrypt";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";
import { User as UserModel, IUser } from "../schemas/user";
import { Token as TokenModel } from "../schemas/token";
import { Item as ItemModel } from "../../schemas/item";

import { RESPONSES } from "./utils";
import { ITEM_PATHS } from "../../__tests__/utils";

interface IAUTH_PATHS { [key: string]: string }
interface IROUTES { [key: string]: string | { [key: string]: string } };

let AUTH_PATHS: IAUTH_PATHS = {
	SIGNUP: "POST /auth/signup",
	LOGIN: "POST /auth/login",
	REFRESH: "POST /auth/refresh",
	LOGOUT: "DELETE /auth/logout",
	GET_USER: "GET /user",
	UPDATE_USER: "PATCH /user",
	DELETE_USER: "DELETE /user",
	GET_ALL_USERS: "GET /users",
	GET_USER_BY_ID: "GET /users/:id",
	UPDATE_USER_BY_ID: "PATCH /users/:id",
	DELETE_USER_BY_ID: "DELETE /users/:id",
}

let ROUTES: any = {
	AUTH: {
		SIGNUP: "/auth/signup",
		LOGIN: "/auth/login",
		REFRESH: "/auth/refresh",
		LOGOUT: "/auth/logout",
	},
	USER: "/user",
	USERS: "/users",
	ITEMS: "/items/",
}

describe("Authentication with JWT", function () {

	interface TestUser {
		access_token?: string,
		refresh_token?: string,
		username?: string,
		id?: string,
		items?: any[]
	}

	interface TestUsers {
		[user: string]: TestUser
	}

	var users: TestUsers = {
		basic01: { items: [] },
		basic02: { items: [] },
		basic03: { items: [] },
		admin01: { items: [] },
		admin02: { items: [] },
		super01: { items: [] },
		super02: { items: [] },
	};

	/**
	 * Returns true if user is the requested user or has higher access level
	 */
	function isAuthorized(name1: string, name2: string) {
		return (
			(name1 === name2) 
			||
			(
				name1.includes("basic") && ( 
					name2.includes("admin") || 
					name2.includes("super") 
				)
			) 
			||	
			(
				name1.includes("admin") && 
				name2.includes("super")
			)
		)

		// basic01 & basic01 = true
		// basic01 & basic02 = false
		// basic01 & admin01 = true
		// basic01 & super01 = true

		// admin01 & basic01 = false
		// admin01 & admin01 = true
		// admin01 & admin02 = false
		// admin01 & super01 = true

		// super01 & basic01 = false
		// super01 & admin01 = false
		// super01 & super01 = true
		// super01 & super02 = false
	}

	before( done => {
		connect()
			.then( async () => {

				// TODO: Create 4 items on each user here then just one item for each role in tests

				let passwordHash: string;

				{ // ========== CREATE PASSWORD HASH ==========
					var salt = bcrypt.genSaltSync(13)
					passwordHash = await bcrypt.hash("S3an1234", salt);
				}

				async function createItem(user: IUser) {
					const item = new ItemModel({
						userId: user._id,
						title: user.username,
					})
					await item.save().then( doc => {
						users[user.username.toString()].items?.push(doc);
					}).catch( err => console.log(err));
				}

				async function createUser(username: string, email: string, role: string) {
					const user = new UserModel({
						role: role,
						email: email,
						username: username,
						password: passwordHash,
					})
					await user.save().then( doc => {
						users[username].username = doc.username.toString();
						users[username].id = doc._id.toString();
						for (let i=0; i <= 4; i++) {
							createItem(doc);
						}
					}).catch( err => console.log(err));
				}

				createUser("basic01", "basic01@gmail.com", "basic");
				createUser("basic03", "basic03@gmail.com", "basic");
				createUser("admin01", "admin01@gmail.com", "admin");
				createUser("admin02", "admin02@gmail.com", "admin");
				createUser("super01", "super01@gmail.com", "superuser");
				createUser("super02", "super02@gmail.com", "superuser");

				done()
			})
			.catch((err) => done(err));
	})

	after( done => {

		// ===== CLEAR DATABASE =====
		UserModel.deleteMany().then().catch( err  => console.log(err) );
		TokenModel.deleteMany().then().catch( err  => console.log(err) );
		ItemModel.deleteMany().then().catch( err  => console.log(err) );

		close()
			.then( () => {
				done();
			})
			.catch((err) => done(err));
	})
	
	describe(AUTH_PATHS.SIGNUP, function () {

		describe("Signup w/ valid credentials (basic02)", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.post(ROUTES.AUTH.SIGNUP)
					.send({ email: "basic02@gmail.com", password: "S3an1234", password2: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(201);
						expect(body).to.be.property("success");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Signup w/ invalid password(s) that-", function () {

			function signupWithInvalidPassword(description: string, pass1: string, pass2: string, prop: string) {
				describe(description, function () {
					it(RESPONSES.BAD_REQUEST, function (done) {
						request(app)
							.post(ROUTES.AUTH.SIGNUP)
							.send({ email: "basic02@gmail.com", password: pass1, password2: pass2 })
							.then((res: any) => {
								const status = res.statusCode;
								const body = res.body;
								expect(status).to.equal(400);
								expect(body).to.be.property(prop);
								done();
							})
							.catch((err: any) => done(err));
					});
				})
			}

			signupWithInvalidPassword("don't match", "S3an1234", "S3an12345", "password2");
			signupWithInvalidPassword("is too short", "S3an123", "S3an123", "password");
			signupWithInvalidPassword(
				"is too long", "S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S",
				"S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S", 
				"password"
			);
		})

		describe("Signup w/", function () {

			function emailRelatedSignup(description: string, email: string) {
				describe(description, function () {
					it("Responds with error message", function (done) {
						request(app)
							.post(ROUTES.AUTH.SIGNUP)
							.send({ email: email, password: "S3an1234", password2: "S3an1234" })
							.then((res: any) => {
								const status = res.statusCode;
								const body = res.body;
								expect(status).to.equal(400);
								expect(body).to.be.property("email");
								done();
							})
							.catch((err: any) => done(err));
					});
				})
			}
	
			emailRelatedSignup("email already in use", "basic01@gmail.com");
			emailRelatedSignup("invalid email", "basic01gmail.com");
		})
	})

	describe(AUTH_PATHS.LOGIN, function () {

		function login (name: string) {
			describe(`Login with valid credentials (${name})`, function () {
				it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
					request(app)
						.post(ROUTES.AUTH.LOGIN)
						.send({ username: `${name}@gmail.com`, password: "S3an1234" })
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							users[name].access_token = res.body["accessToken"] || null;
							users[name].refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
							expect(status).to.equal(200);
							expect(body).to.be.property("accessToken");
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		login("basic01");
		login("basic02");
		login("basic03");
		login("admin01");
		login("admin02");
		login("super01");
		login("super02");

		describe("Login w/o password", function () {
			it(RESPONSES.BAD_REQUEST, function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "basic01@gmail.com" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(400);
						expect(body).to.be.property("password");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login w/o username/email", function () {
			it(RESPONSES.BAD_REQUEST, function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(400);
						expect(body).to.be.property("username");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with incorrect username/email", function () {
			it(RESPONSES.NOT_FOUND, function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "anInvalidUsername1234", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(404);
						expect(body).to.be.property("username");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with incorrect password", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "basic01@gmail.com", password: "S3an12345" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(400);
						expect(body).to.be.property("password");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	// ========== ITEMS ==========

	describe(ITEM_PATHS.CREATE, function () {

		describe(`Create Item w/ no attribute`, function() {
			it(RESPONSES.BAD_REQUEST, function (done) {
				request(app)
					.post(ROUTES.ITEMS)
					.send({})
					.set("Authorization", `Bearer ${users.basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(500);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		function createItem(name: string) {
			describe(`Create Item (${name})`, function() {
				it("Response: 200 + Item", function (done) {
					request(app)
						.post(ROUTES.ITEMS)
						.send({ title: `Item (${name})` })
						.set("Authorization", `Bearer ${users[name].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							users[name].items?.push(body);
							expect(status).to.equal(201);
							expect(body).to.have.property("title");
							expect(body).to.have.property("userId");
							expect(body).to.have.property("_id");
							expect(body).to.have.property("createdAt");
							expect(body).to.have.property("updatedAt");
							expect(body).to.have.property("__v");
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		createItem("basic01");
		createItem("basic02");
		createItem("admin01");
		createItem("admin02");
		createItem("super01");
		createItem("super02");
	})


	describe(ITEM_PATHS.GET_ONE, function () {

		function getItemById(user1: string, user2: string, response: string, success: boolean) {
			describe(`Get Item belonging to ${user1} as ${user2}`, function () {
				it(response, function (done) {
					request(app)
						// @ts-ignore
						.get(ROUTES.ITEMS + users[user1].items[0]._id)
						.set("Authorization", `Bearer ${users[user2].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
								expect(body).to.have.property("title");
								expect(body).to.have.property("userId");
								expect(body).to.have.property("_id");
								expect(body).to.have.property("createdAt");
								expect(body).to.have.property("updatedAt");
								expect(body).to.have.property("__v");
								
							} else {
								expect(status).to.equal(401);
								expect(body).to.not.have.property("title");
								expect(body).to.not.have.property("userId");
								expect(body).to.not.have.property("_id");
								expect(body).to.not.have.property("createdAt");
								expect(body).to.not.have.property("updatedAt");
								expect(body).to.not.have.property("__v");
							}

							done();
						})
						.catch((err: any) => done(err));
				})
			})
		}

		getItemById("basic01", "basic01", RESPONSES.SUCCESS, true);
		getItemById("basic01", "basic02", RESPONSES.UNAUTHORIZED, false);
		getItemById("basic01", "admin01", RESPONSES.SUCCESS, true);
		getItemById("basic01", "super01", RESPONSES.SUCCESS, true);

		getItemById("admin01", "basic01", RESPONSES.UNAUTHORIZED, false);
		getItemById("admin01", "admin01", RESPONSES.SUCCESS, true);
		getItemById("admin01", "admin02", RESPONSES.UNAUTHORIZED, false);
		getItemById("admin01", "super01", RESPONSES.SUCCESS, true);

		getItemById("super01", "basic01", RESPONSES.UNAUTHORIZED, false);
		getItemById("super01", "admin01", RESPONSES.UNAUTHORIZED, false);
		getItemById("super01", "super01", RESPONSES.SUCCESS, true);
		getItemById("super01", "super02", RESPONSES.UNAUTHORIZED, false);

	})

	describe(ITEM_PATHS.GET_ALL, function () {

		function getAll(user: string) {
			describe("Get all of the requesting users items", function () {
				it(RESPONSES.SUCCESS, function () {
					request(app)
						.get(ROUTES.ITEMS + "all/")
						.set("Authorization", `Bearer ${users[user].access_token}`)
						.then( res => {
							const status = res.statusCode;
							const body = res.body;
							expect(status).to.equal(200);
							// TODO: Expect an array and check the first item for each expected property
						}).catch( err => console.log(err));
				})
			})
		}

		getAll("basic01");
		getAll("admin01");
		getAll("super01");

	})

	describe(ITEM_PATHS.GET_ALL_FOREIGN, function () {

		function getAll(user1: string, user2: string, response: string, success: boolean) {
			describe(`Get all of ${user1}'s items as ${user2}`, function () {
				it(response, function () {
					request(app)
						.get(ROUTES.ITEMS + "all/" + users[user1].id)
						.set("Authorization", `Bearer ${users[user2].access_token}`)
						.then( res => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
							} else {
								expect(status).to.equal(401);
							}
							// TODO: Expect an array and check the first item for each expected property
						}).catch( err => console.log(err));
				})
			})
		}

		getAll("basic01", "basic01", RESPONSES.SUCCESS, true);
		getAll("basic01", "basic02", RESPONSES.UNAUTHORIZED, false);
		getAll("basic01", "admin01", RESPONSES.SUCCESS, true);
		getAll("basic01", "super01", RESPONSES.SUCCESS, true);

		getAll("admin01", "basic01", RESPONSES.UNAUTHORIZED, false);
		getAll("admin01", "admin01", RESPONSES.SUCCESS, true);
		getAll("admin01", "admin02", RESPONSES.UNAUTHORIZED, false);
		getAll("admin01", "super01", RESPONSES.SUCCESS, true);

		getAll("super01", "basic01", RESPONSES.UNAUTHORIZED, false);
		getAll("super01", "admin01", RESPONSES.UNAUTHORIZED, false);
		getAll("super01", "super01", RESPONSES.SUCCESS, true);
		getAll("super01", "super02", RESPONSES.UNAUTHORIZED, false);
	})

	describe(ITEM_PATHS.UPDATE_ONE, function () {

		function updateItemById(user1: string, user2: string, response: string, success: boolean) {
			describe(`Update 'title' attribute on Item belonging to ${user1} as ${user2}`, function () {
				it(response, function (done) {
					request(app)
						// @ts-ignore
						.patch(ROUTES.ITEMS + users[user1].items[0]._id)
						.send({ title: `Changed by ${user2}` })
						.set("Authorization", `Bearer ${users[user2].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
								expect(body).to.have.property("title");
								expect(body).to.have.property("userId");
								expect(body).to.have.property("_id");
								expect(body).to.have.property("createdAt");
								expect(body).to.have.property("updatedAt");
								expect(body).to.have.property("__v");
								
							} else {
								expect(status).to.equal(401);
								expect(body).to.not.have.property("title");
								expect(body).to.not.have.property("userId");
								expect(body).to.not.have.property("_id");
								expect(body).to.not.have.property("createdAt");
								expect(body).to.not.have.property("updatedAt");
								expect(body).to.not.have.property("__v");
							}

							done();
						})
						.catch((err: any) => done(err));
				})
			})
		}

		updateItemById("basic01", "basic01", RESPONSES.SUCCESS, true);
		updateItemById("basic01", "basic02", RESPONSES.UNAUTHORIZED, false);
		updateItemById("basic01", "admin01", RESPONSES.SUCCESS, true);
		updateItemById("basic01", "super01", RESPONSES.SUCCESS, true);

		updateItemById("admin01", "basic01", RESPONSES.UNAUTHORIZED, false);
		updateItemById("admin01", "admin01", RESPONSES.SUCCESS, true);
		updateItemById("admin01", "admin02", RESPONSES.UNAUTHORIZED, false);
		updateItemById("admin01", "super01", RESPONSES.SUCCESS, true);

		updateItemById("super01", "basic01", RESPONSES.UNAUTHORIZED, false);
		updateItemById("super01", "admin01", RESPONSES.UNAUTHORIZED, false);
		updateItemById("super01", "super01", RESPONSES.SUCCESS, true);
		updateItemById("super01", "super02", RESPONSES.UNAUTHORIZED, false);
	})

	describe(ITEM_PATHS.DELETE_ONE, function () {

		function deleteItemById(user1: string, user2: string, response: string, success: boolean) {
			describe(`Delete Item belonging to ${user1} as ${user2}`, function () {
				it(response, function (done) {
					request(app)
						// @ts-ignore
						.delete(ROUTES.ITEMS + users[user1].items[0]._id)
						.set("Authorization", `Bearer ${users[user2].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
								// @ts-ignore
								users[user1].items.shift();
							} else {
								expect(status).to.equal(401);
								expect(body).to.not.have.property("title");
								expect(body).to.not.have.property("userId");
								expect(body).to.not.have.property("_id");
								expect(body).to.not.have.property("createdAt");
								expect(body).to.not.have.property("updatedAt");
								expect(body).to.not.have.property("__v");
							}

							done();
						})
						.catch((err: any) => done(err));
				})
			})
		}

		deleteItemById("basic01", "basic01", RESPONSES.SUCCESS, true);
		deleteItemById("basic01", "basic02", RESPONSES.UNAUTHORIZED, false);
		deleteItemById("basic01", "admin01", RESPONSES.SUCCESS, true);
		deleteItemById("basic01", "super01", RESPONSES.SUCCESS, true);

		deleteItemById("admin01", "basic01", RESPONSES.UNAUTHORIZED, false);
		deleteItemById("admin01", "admin01", RESPONSES.SUCCESS, true);
		deleteItemById("admin01", "admin02", RESPONSES.UNAUTHORIZED, false);
		deleteItemById("admin01", "super01", RESPONSES.SUCCESS, true);

		deleteItemById("super01", "basic01", RESPONSES.UNAUTHORIZED, false);
		deleteItemById("super01", "admin01", RESPONSES.UNAUTHORIZED, false);
		deleteItemById("super01", "super01", RESPONSES.SUCCESS, true);
		deleteItemById("super01", "super02", RESPONSES.UNAUTHORIZED, false);
	})

	// ========== END OF ITEMS ==========

	describe(AUTH_PATHS.GET_USER, function () {
		describe("w/o accessToken", function() {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.get(ROUTES.USER)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		function getUser (name: string) {
			describe(`w/ accessToken (${name})`, function() {
				it("Responds with user info", function (done) {
					request(app)
						.get(ROUTES.USER)
						.set("Authorization", `Bearer ${users[name].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							users[name].username = body?.username;
							users[name].id = body?._id.toString();
							expect(status).to.equal(200);
							expect(body).to.have.property("verified");
							expect(body).to.have.property("_id");
							expect(body).to.have.property("role");
							expect(body).to.have.property("username");
							expect(body).to.have.property("email");
							expect(body).to.have.property("createdAt");
							expect(body).to.have.property("updatedAt");
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		getUser("basic02");
		getUser("admin01");
		getUser("super01");
	})

	describe(AUTH_PATHS.GET_ALL_USERS, function () {

		function getAllUsers(name: string) {
			const basic = "only username and createdAt properties";
			const adminOrSuper = "all properties";
			describe(`as ${name}`, function () {
				it(`Responds with list of users containing only ${basic || adminOrSuper}`, function (done) {
					request(app)
						.get(ROUTES.USERS)
						.set("Authorization", `Bearer ${users[name].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							const user = body[0];

							expect(status).to.equal(200);
							expect(user).to.have.property("username");
							expect(user).to.have.property("createdAt");
							expect(user).to.have.property("_id");

							if (name.includes("admin") || name.includes("super")) {
								expect(user).to.have.property("email");
								expect(user).to.have.property("password");
								expect(user).to.have.property("verified");
								expect(user).to.have.property("role");
								expect(user).to.have.property("updatedAt");
								expect(user).to.have.property("__v");
							} else {
								expect(user).to.not.have.property("email");
								expect(user).to.not.have.property("password");
								expect(user).to.not.have.property("verified");
								expect(user).to.not.have.property("role");
								expect(user).to.not.have.property("updatedAt");
								expect(user).to.not.have.property("__v");
							}
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		getAllUsers("basic01");
		getAllUsers("admin01");
		getAllUsers("super01");
	})
	
	describe(AUTH_PATHS.GET_USER_BY_ID, function () {

		function getUserById(name1: string, name2: string) {

			// admin01 & admin02 = false (admin01 as admin02) true ?
			// super01 & admin01 = false (super01 as admin01) true ?
			// super01 & super02 = false (super01 as super02) true ?

			let res1 = "all of the users properties";
			let res2 = "the properties username, createdAt & _id";

			describe(`get ${name1} as ${name2}`, function () {
				it(`Responds with ${isAuthorized(name1, name2) ? res1 : res2}`, function (done) {
					request(app)
						.get(`/users/${users[name1].id}`)
						.set("Authorization", `Bearer ${users[name2].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							expect(status).to.equal(200);
							expect(body).to.have.property("username");
							expect(body).to.have.property("createdAt");
							expect(body).to.have.property("_id");

							if (isAuthorized(name1, name2)) {
								expect(body).to.have.property("email");
								expect(body).to.have.property("password");
								expect(body).to.have.property("verified");
								expect(body).to.have.property("role");
								expect(body).to.have.property("updatedAt");
								expect(body).to.have.property("__v");
							} else {
								expect(body).to.not.have.property("email");
								expect(body).to.not.have.property("password");
								expect(body).to.not.have.property("verified");
								expect(body).to.not.have.property("role");
								expect(body).to.not.have.property("updatedAt");
								expect(body).to.not.have.property("__v");
							}

							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		// TODO: Add the three tests commented out below

		getUserById("basic01", "basic01");
		getUserById("basic01", "basic02");
		getUserById("basic01", "admin01");
		getUserById("basic01", "super01");

		getUserById("admin01", "basic01");
		getUserById("admin01", "admin01");
		// getUserById("admin01", "admin02");
		getUserById("admin01", "super02");

		getUserById("super01", "basic01");
		// getUserById("super01", "admin01");
		getUserById("super01", "super01");
		// getUserById("super01", "super02");
	})
	
	describe(AUTH_PATHS.UPDATE_USER_BY_ID, function () {

		function updateUserById(name1: string, name2: string) {
			describe(`update ${name1} as ${name2}`, function () {
				it(isAuthorized(name1, name2) ? RESPONSES.SUCCESS : RESPONSES.UNAUTHORIZED, function (done) {
					request(app)
						.patch(`/users/${users[name1].id}`)
						.send({ firstName: "Random" })
						.set("Authorization", `Bearer ${users[name2].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;

							if (isAuthorized(name1, name2)) {
								expect(status).to.equal(200);
								expect(body).to.have.property("firstName");
								expect(body).to.have.property("username");
								expect(body).to.have.property("createdAt");
								expect(body).to.have.property("_id");
								expect(body).to.have.property("email");
								expect(body).to.have.property("password");
								expect(body).to.have.property("verified");
								expect(body).to.have.property("role");
								expect(body).to.have.property("updatedAt");
								expect(body).to.have.property("__v");
							} else {
								expect(status).to.equal(401);
								expect(body).to.have.property("error");
							}
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		updateUserById("basic01", "basic01");
		updateUserById("basic03", "basic01");
		updateUserById("admin02", "basic01");
		updateUserById("super02", "basic01");

		updateUserById("basic03", "admin01");
		updateUserById("admin01", "admin01");
		updateUserById("admin02", "admin01");
		updateUserById("super02", "admin01");

		updateUserById("basic03", "super01");
		updateUserById("admin02", "super01");
		updateUserById("super01", "super01");
		updateUserById("super02", "super01");
	})

	describe(AUTH_PATHS.UPDATE_USER, function () {
		
		describe("Modify \"firstName\"", function() {	
			it("Responds with user info", function (done) {
				request(app)
				.patch(ROUTES.USER)
				.send({ firstName: "Sean" })
				.set("Authorization", `Bearer ${users.basic01.access_token}`)
				.then((res: any) => {
					const status = res.statusCode;
					const body = res.body;
					expect(status).to.equal(200);
					expect(body).to.be.property("verified");
					expect(body).to.be.property("_id");
					expect(body).to.be.property("role");
					expect(body).to.be.property("username");
					expect(body).to.be.property("email");
					expect(body).to.be.property("createdAt");
					expect(body).to.be.property("updatedAt");
					expect(body).to.be.property("firstName");
					done();
				})
				.catch((err: any) => done(err));
			});
		})

		describe("Modify \"username\" with username that-", function () {

			function modifyUsername(user: string, username: string, description: string) {
				describe(description, function() {
					it(RESPONSES.SERVER_ERROR, function (done) {
						request(app)
						.patch(ROUTES.USER)
						.send({ username: username })
						.set("Authorization", `Bearer ${users[user].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							expect(status).to.equal(500);
							expect(body).to.be.property("error");
							done();
						})
						.catch((err: any) => done(err));
					});
				});
			}

			modifyUsername("basic02", "basic01", "already exists");
			modifyUsername("basic01", "too", "is too short");
			modifyUsername("basic01", "basic01basic01basic01basic01basic01basic01basic01basic01", "is too long");
			modifyUsername("basic01", "basic@01", "contains the @ symbol");

			// TODO: describe("username that uses blacklisted words", function() {});
		})
		
		describe("Modify \"role\" as-", function() {

			function modifyRole(name1: string, role: string, success: boolean, response: string) {
				describe(`${name1}`, function() {
					it(response, function (done) {
						request(app)
						.patch(ROUTES.USER)
						.send({ role: role })
						.set("Authorization", `Bearer ${users[name1].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
							} else {
								expect(status).to.equal(401);
								expect(body).to.be.property("error");
							}
							done();
						})
						.catch((err: any) => done(err));
					});
				})
			}
			
			modifyRole("basic01", "admin", false, RESPONSES.UNAUTHORIZED);
			modifyRole("admin01", "superuser", false, RESPONSES.UNAUTHORIZED);
			modifyRole("super01", "superuser", true, RESPONSES.SUCCESS);
		})
		
		describe("Modify \"verified\" as-", function() {

			function modifyVerified(name1: string, success: boolean, response: string) {
				describe(`${name1}`, function() {
					it(response, function (done) {
						request(app)
						.patch(ROUTES.USER)
						.send({ verified: true })
						.set("Authorization", `Bearer ${users[name1].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
							} else {
								expect(status).to.equal(401);
								expect(body).to.be.property("error");
							}
							done();
						})
						.catch((err: any) => done(err));
					});
				})
			}

			modifyVerified("basic01", false, RESPONSES.UNAUTHORIZED);
			modifyVerified("admin01", true, RESPONSES.SUCCESS);
			modifyVerified("super01", true, RESPONSES.SUCCESS);
		})
	})

	describe(AUTH_PATHS.REFRESH, function () {
		describe("w/o refreshToken", function () {
			it("Responds with new access token", function (done) {
				request(app)
					.post(ROUTES.AUTH.REFRESH)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("w/ refreshToken (basic01)", function () {
			it("Responds with new access token", function (done) {
				request(app)
					.post(ROUTES.AUTH.REFRESH)
					.set("Cookie", users.basic01.refresh_token!)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						users.basic01.access_token = body["accessToken"] || null;
						users.basic01.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe(AUTH_PATHS.LOGOUT, function () {
		describe("Logout w/ invalid refresh token", function () {
			it(RESPONSES.BAD_REQUEST, function (done) {
				request(app)
					.delete(ROUTES.AUTH.LOGOUT)
					.set("Cookie", "refreshToken=invalidTokenValue;")
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(400);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
		
		describe("Logout with valid refresh token (basic01)", function () {
			it("Responds with status 204", function (done) {
				request(app)
					.delete(ROUTES.AUTH.LOGOUT)
					.set("Cookie", users.basic01.refresh_token!)
					.then((res: any) => {
						const status = res.statusCode;
						expect(status).to.equal(204);
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe(AUTH_PATHS.DELETE_USER_BY_ID, function () {

		function deleteUserById(user1: string, user2: string, response: string, success: boolean) {
			describe(`delete ${user2} as ${user1}`, function () {
				it(response, function (done) {
					request(app)
						.delete(`/users/${users[user2].id}`)
						.set("Authorization", `Bearer ${users[user1].access_token}`)
						.then( (res: any) => {
							const status = res.statusCode;
							const body = res.body;
							if (success) {
								expect(status).to.equal(200);
								expect(body).to.be.property("success");
							} else {
								expect(status).to.equal(401);
								expect(body).to.be.property("error");
							}
							done();
						})
						.catch((err: any) => done(err));
				})
			})
		}

		deleteUserById("basic01", "basic03", RESPONSES.UNAUTHORIZED, false);
		deleteUserById("admin01", "basic03", RESPONSES.SUCCESS, true);
		deleteUserById("admin02", "admin01", RESPONSES.UNAUTHORIZED, false);
		deleteUserById("super01", "admin02", RESPONSES.SUCCESS, true);
		deleteUserById("super01", "super02", RESPONSES.UNAUTHORIZED, false);
	})

	describe(AUTH_PATHS.DELETE_USER, function () {

		function deleteUser(user: string) {
			describe(user, function() {
				it(RESPONSES.SUCCESS, function (done) {
					request(app)
						.delete(ROUTES.USER)
						.set("Authorization", `Bearer ${users[user].access_token}`)
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							expect(status).to.equal(200);
							expect(body).to.be.property("success");
							done();
						})
						.catch((err: any) => done(err));
				});
			})
		}

		deleteUser("basic01");
		deleteUser("admin01");
		deleteUser("super01");
	})

})