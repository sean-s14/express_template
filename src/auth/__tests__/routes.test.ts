import { expect } from "chai";
import request from "supertest";
import bcrypt from "bcrypt";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";
import { User as UserModel } from "../schemas/user";
import { Token as TokenModel } from "../schemas/token";


let RESPONSES: any = {
	SUCCESS: "200 success",
	BAD_REQUEST: "400 bad request",
	UNAUTHORIZED: "401 unauthorized",
	FORBIDDEN: "403 forbidden",
	NOT_FOUND: "404 not found",
	SERVER_ERROR: "500 server error",
}

RESPONSES = Object.fromEntries(Object.entries(RESPONSES).map( arr => {
    arr[1] = `Response: ${arr[1]}`;
    return arr;
}))

let PATHS: any = {
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
	ITEMS: "/items"
}


describe("Authentication with JWT", function () {

	interface TestUser {
		access_token?: string,
		refresh_token?: string,
		username?: string,
		id?: string,
	}

	var basic01: TestUser = {};
	var basic02: TestUser = {};
	var basic03: TestUser = {};
	var admin01: TestUser = {};
	var admin02: TestUser = {};
	var super01: TestUser = {};
	var super02: TestUser = {};

	before( done => {
		connect()
			.then( async () => {

				let passwordHash;

				{ // ========== CREATE PASSWORD HASH ==========
					var salt = bcrypt.genSaltSync(13)
					passwordHash = await bcrypt.hash("S3an1234", salt);
				}

				{ // ===== CREATE BASIC USER (basic01) =====
					const basic = new UserModel({
						role: "basic",
						email: "basic01@gmail.com",
						username: "basic01",
						password: passwordHash,
					})
					await basic.save().then( doc => {
						basic01.username = doc.username.toString();
						basic01.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE BASIC USER (basic03) =====
					const basic = new UserModel({
						role: "basic",
						email: "basic03@gmail.com",
						username: "basic03",
						password: passwordHash,
					})
					await basic.save().then( doc => {
						basic03.username = doc.username.toString();
						basic03.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE ADMIN USER (admin01) =====
					const admin = new UserModel({
						role: "admin",
						email: "admin01@gmail.com",
						username: "admin01",
						password: passwordHash,
					})
					await admin.save().then( doc => {
						admin01.username = doc.username.toString();
						admin01.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE ADMIN USER (admin02) =====
					const admin = new UserModel({
						role: "admin",
						email: "admin02@gmail.com",
						username: "admin02",
						password: passwordHash,
					})
					await admin.save().then( doc => {
						admin02.username = doc.username.toString();
						admin02.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE SUPER USER (super01) =====
					const superuser = new UserModel({
						role: "superuser",
						email: "super01@gmail.com",
						username: "super01",
						password: passwordHash,
					})
					await superuser.save().then( doc => {
						super01.username = doc.username.toString();
						super01.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE SUPER USER (super02) =====
					const superuser = new UserModel({
						role: "superuser",
						email: "super02@gmail.com",
						username: "super02",
						password: passwordHash,
					})
					await superuser.save().then( doc => {
						super02.username = doc.username.toString();
						super02.id = doc._id.toString();
					}).catch( err => console.log(err));
				}

				done()
			})
			.catch((err) => done(err));
	})

	after( done => {

		// ===== CLEAR DATABASE =====
		UserModel.deleteMany().then().catch( err  => console.log(err) );
		TokenModel.deleteMany().then().catch( err  => console.log(err) );

		close()
			.then( () => {
				done();
			})
			.catch((err) => done(err));
	})
	
	describe(PATHS.SIGNUP, function () {

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
			describe("don't match", function () {
				it("Responds with error message", function (done) {
					request(app)
						.post(ROUTES.AUTH.SIGNUP)
						.send({ email: "basic02@gmail.com", password: "S3an1234", password2: "S3an12345" })
						.then((res: any) => {
							const status = res.statusCode;
							const body = res.body;
							expect(status).to.equal(400);
							expect(body).to.be.property("password2");
							done();
						})
						.catch((err: any) => done(err));
				});
			})

			describe("is too short", function () {
				it("Responds with error message", function (done) {
					request(app)
						.post(ROUTES.AUTH.SIGNUP)
						.send({ email: "basic02@gmail.com", password: "S3an123", password2: "S3an123" })
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

			describe("is too long", function () {
				it("Responds with error message", function (done) {
					request(app)
						.post(ROUTES.AUTH.SIGNUP)
						.send({
							email: "basic02@gmail.com",
							password: "S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S",
							password2: "S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S3an1234S"
						})
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

		describe("Signup w/ email already in use", function () {
			it("Responds with error message", function (done) {
				request(app)
					.post(ROUTES.AUTH.SIGNUP)
					.send({ email: "basic01@gmail.com", password: "S3an1234", password2: "S3an1234" })
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

		describe("Signup w/ invalid email", function () {
			it("Responds with error message", function (done) {
				request(app)
					.post(ROUTES.AUTH.SIGNUP)
					.send({ email: "basic01gmail.com", password: "S3an1234", password2: "S3an1234" })
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
	})

	describe(PATHS.LOGIN, function () {
		describe("Login with valid credentials (basic01)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "basic01@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic01.access_token = res.body["accessToken"] || null;
						basic01.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (basic02)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "basic02@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic02.access_token = res.body["accessToken"] || null;
						basic02.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (basic03)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "basic03@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic03.access_token = res.body["accessToken"] || null;
						basic03.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (admin01)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "admin01@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						admin01.access_token = res.body["accessToken"] || null;
						admin01.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (admin02)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "admin02@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						admin02.access_token = res.body["accessToken"] || null;
						admin02.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (super01)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "super01@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						super01.access_token = res.body["accessToken"] || null;
						super01.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Login with valid credentials (super02)", function () {
			it("Response: 200 + accessToken + refreshToken (in cookie)", function (done) {
				request(app)
					.post(ROUTES.AUTH.LOGIN)
					.send({ username: "super02@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						super02.access_token = res.body["accessToken"] || null;
						super02.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

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

	describe(PATHS.GET_USER, function () {
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

		describe("w/ accessToken (basic02)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get(ROUTES.USER)
					.set("Authorization", `Bearer ${basic02.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic02.username = body?.username;
						basic02.id = body?._id.toString();
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

		describe("w/ accessToken (admin01)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get(ROUTES.USER)
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						admin01.username = body?.username;
						admin01.id = body?._id.toString();
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

		describe("w/ accessToken (super01)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get(ROUTES.USER)
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						super01.username = body?.username;
						super01.id = body?._id.toString();
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
	})

	describe(PATHS.GET_ALL_USERS, function () {
		describe("as basic01", function () {
			it("Responds with list of users containing only username and createdAt properties", function (done) {
				request(app)
					.get(ROUTES.USERS)
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						const user = body[0];
						expect(status).to.equal(200);
						expect(user).to.have.property("username");
						expect(user).to.have.property("createdAt");
						expect(user).to.have.property("_id");
						expect(user).to.not.have.property("email");
						expect(user).to.not.have.property("password");
						expect(user).to.not.have.property("verified");
						expect(user).to.not.have.property("role");
						expect(user).to.not.have.property("updatedAt");
						expect(user).to.not.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("as admin01", function () {
			it("Responds with list of users containing all properties", function (done) {
				request(app)
					.get(ROUTES.USERS)
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						const user = body[0];
						expect(status).to.equal(200);
						expect(user).to.have.property("username");
						expect(user).to.have.property("createdAt");
						expect(user).to.have.property("email");
						expect(user).to.have.property("password");
						expect(user).to.have.property("verified");
						expect(user).to.have.property("role");
						expect(user).to.have.property("_id");
						expect(user).to.have.property("updatedAt");
						expect(user).to.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("as super01", function () {
			it("Responds with list of users containing all properties", function (done) {
				request(app)
					.get(ROUTES.USERS)
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						const user = body[0];
						expect(status).to.equal(200);
						expect(user).to.have.property("username");
						expect(user).to.have.property("createdAt");
						expect(user).to.have.property("email");
						expect(user).to.have.property("password");
						expect(user).to.have.property("verified");
						expect(user).to.have.property("role");
						expect(user).to.have.property("_id");
						expect(user).to.have.property("updatedAt");
						expect(user).to.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})
	
	describe(PATHS.GET_USER_BY_ID, function () {
		describe("get basic01 as basic01", function () {
			it("Responds with all of the users properties", function (done) {
				request(app)
					.get(`/users/${basic01.id}`)
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.have.property("username");
						expect(body).to.have.property("createdAt");
						expect(body).to.have.property("_id");
						expect(body).to.have.property("email");
						expect(body).to.have.property("password");
						expect(body).to.have.property("verified");
						expect(body).to.have.property("role");
						expect(body).to.have.property("updatedAt");
						expect(body).to.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("get basic01 as basic02", function () {
			it("Responds with the specified users _id, username & createdAt properties", function (done) {
				request(app)
					.get(`/users/${basic01.id}`)
					.set("Authorization", `Bearer ${basic02.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.have.property("username");
						expect(body).to.have.property("createdAt");
						expect(body).to.have.property("_id");
						expect(body).to.not.have.property("email");
						expect(body).to.not.have.property("password");
						expect(body).to.not.have.property("verified");
						expect(body).to.not.have.property("role");
						expect(body).to.not.have.property("updatedAt");
						expect(body).to.not.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("get basic01 as admin01", function () {
			it("Responds with all of the users properties", function (done) {
				request(app)
					.get(`/users/${basic01.id}`)
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.have.property("username");
						expect(body).to.have.property("createdAt");
						expect(body).to.have.property("_id");
						expect(body).to.have.property("email");
						expect(body).to.have.property("password");
						expect(body).to.have.property("verified");
						expect(body).to.have.property("role");
						expect(body).to.have.property("updatedAt");
						expect(body).to.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("get basic01 as super01", function () {
			it("Responds with all of the users properties", function (done) {
				request(app)
					.get(`/users/${basic01.id}`)
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.have.property("username");
						expect(body).to.have.property("createdAt");
						expect(body).to.have.property("_id");
						expect(body).to.have.property("email");
						expect(body).to.have.property("password");
						expect(body).to.have.property("verified");
						expect(body).to.have.property("role");
						expect(body).to.have.property("updatedAt");
						expect(body).to.have.property("__v");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})
	
	describe(PATHS.UPDATE_USER_BY_ID, function () {
		describe("update basic03 as basic01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${basic03.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update admin02 as basic01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${admin02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update super02 as basic01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${super02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update basic03 as admin01", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.patch(`/users/${basic03.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
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
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update admin02 as admin01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${admin02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update super02 as admin01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${super02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update basic03 as super01", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.patch(`/users/${basic03.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
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
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update admin02 as super01", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.patch(`/users/${admin02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
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
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("update super02 as super01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.patch(`/users/${super02.id}`)
					.send({ firstName: "Random" })
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.have.property("error");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe(PATHS.UPDATE_USER, function () {
		
		describe("Modify \"firstName\"", function() {	
			it("Responds with user info", function (done) {
				request(app)
				.patch(ROUTES.USER)
				.send({ firstName: "Sean" })
				.set("Authorization", `Bearer ${basic01.access_token}`)
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
			describe("already exists", function() {
				it(RESPONSES.SERVER_ERROR, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ username: basic01.username })
					.set("Authorization", `Bearer ${basic02.access_token}`)
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

			describe("is too short", function() {
				it(RESPONSES.SERVER_ERROR, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ username: "too" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(500);
						done();
					})
					.catch((err: any) => done(err));
				});
			})

			describe("is too long", function() {
				it(RESPONSES.SERVER_ERROR, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ username: "basic01basic01basic01basic01basic01basic01basic01basic01" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(500);
						done();
					})
					.catch((err: any) => done(err));
				});
			})

			describe("contains the @ symbol", function() {
				it(RESPONSES.SERVER_ERROR, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ username: "basic@01" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(500);
						done();
					})
					.catch((err: any) => done(err));
				});
			})

			// TODO: describe("username that uses blacklisted words", function() {});
		})
		
		describe("Modify \"role\" as-", function() {
			describe("basic user", function() {
				it(RESPONSES.UNAUTHORIZED, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ role: "admin" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
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

			describe("admin", function() {
				it(RESPONSES.UNAUTHORIZED, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ role: "superuser" })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
				});
			});

			describe("superuser", function() {
				it(RESPONSES.SUCCESS, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ role: "superuser" })
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						done();
					})
					.catch((err: any) => done(err));
				});
			});
		})
		
		describe("Modify \"verified\" as-", function() {
			describe("basic user", function() {
				it(RESPONSES.UNAUTHORIZED, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ verified: true })
					.set("Authorization", `Bearer ${basic01.access_token}`)
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

			describe("admin", function() {
				it(RESPONSES.SUCCESS, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ verified: true })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						done();
					})
					.catch((err: any) => done(err));
				});
			});

			describe("superuser", function() {
				it(RESPONSES.SUCCESS, function (done) {
					request(app)
					.patch(ROUTES.USER)
					.send({ verified: true })
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						done();
					})
					.catch((err: any) => done(err));
				});
			});
		})
	})

	describe(PATHS.REFRESH, function () {
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
					.set("Cookie", basic01.refresh_token!)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic01.access_token = body["accessToken"] || null;
						basic01.refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						expect(status).to.equal(200);
						expect(body).to.be.property("accessToken");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe(PATHS.LOGOUT, function () {
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
		
		describe("Logout with valid refresh token", function () {
			it("Responds with status 204", function (done) {
				request(app)
					.delete(ROUTES.AUTH.LOGOUT)
					.set("Cookie", basic01.refresh_token!)
					.then((res: any) => {
						const status = res.statusCode;
						expect(status).to.equal(204);
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe(PATHS.DELETE_USER_BY_ID, function () {
		describe("delete basic03 as basic01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.delete(`/users/${basic03.id}`)
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then( (res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			})
		})

		describe("delete basic03 as admin01", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.delete(`/users/${basic03.id}`)
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then( (res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.be.property("success");
						done();
					})
					.catch((err: any) => done(err));
			})
		})
		
		describe("delete admin02 as admin01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.delete(`/users/${admin02.id}`)
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then( (res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			})
		})
		
		describe("delete admin02 as super01", function () {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.delete(`/users/${admin02.id}`)
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then( (res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(200);
						expect(body).to.be.property("success");
						done();
					})
					.catch((err: any) => done(err));
			})
		})
		
		describe("delete super02 as super01", function () {
			it(RESPONSES.UNAUTHORIZED, function (done) {
				request(app)
					.delete(`/users/${super02.id}`)
					.set("Authorization", `Bearer ${super01.access_token}`)
					.then( (res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(401);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
			})
		})
	})

	describe(PATHS.DELETE_USER, function () {
		describe("basic01", function() {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.delete(ROUTES.USER)
					.set("Authorization", `Bearer ${basic01.access_token}`)
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

		describe("admin01", function() {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.delete(ROUTES.USER)
					.set("Authorization", `Bearer ${admin01.access_token}`)
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

		describe("super01", function() {
			it(RESPONSES.SUCCESS, function (done) {
				request(app)
					.delete(ROUTES.USER)
					.set("Authorization", `Bearer ${super01.access_token}`)
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
	})

})