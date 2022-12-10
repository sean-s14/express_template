import { expect } from "chai";
import request from "supertest";
import bcrypt from "bcrypt";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";
import { User as UserModel } from "../schemas/user";


describe("Authentication with JWT", function () {

	interface TestUser {
		access_token?: string,
		refresh_token?: string,
		username?: string,
		id?: string,
	}

	var basic01: TestUser = {};
	var basic02: TestUser = {};
	var admin01: TestUser = {};
	var super01: TestUser = {};

	before( done => {
		connect()
			.then( async () => {

				let passwordHash;

				{ // ========== CREATE PASSWORD HASH ==========
					var salt = bcrypt.genSaltSync(13)
					passwordHash = await bcrypt.hash("S3an1234", salt);
				}

				{ // ===== CREATE BASIC USER =====
					const basic = new UserModel({
						role: "basic",
						email: "basic01@gmail.com",
						username: "basic01",
						password: passwordHash,
					})
					await basic.save().then( doc => {
						basic01.username = doc.username.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE ADMIN USER =====
					const admin = new UserModel({
						role: "admin",
						email: "admin01@gmail.com",
						username: "admin01",
						password: passwordHash,
					})
					await admin.save().then( doc => {
						admin01.username = doc.username.toString();
					}).catch( err => console.log(err));
				}

				{ // ===== CREATE SUPER USER =====
					const superuser = new UserModel({
						role: "superuser",
						email: "super01@gmail.com",
						username: "super01",
						password: passwordHash,
					})
					await superuser.save().then( doc => {
						super01.username = doc.username.toString();
					}).catch( err => console.log(err));
				}

				done()
			})
			.catch((err) => done(err));
	})

	after( done => {
		close()
			.then( async () => {
				// TODO: Clear "test" database
				done();
			})
			.catch((err) => done(err));
	})
	
	describe("POST /auth/signup", function () {

		describe("Signup w/ valid credentials (basic02)", function () {
			it("Responds with success message", function (done) {
				request(app)
					.post("/auth/signup")
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
						.post("/auth/signup")
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
						.post("/auth/signup")
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
						.post("/auth/signup")
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
					.post("/auth/signup")
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
					.post("/auth/signup")
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

	describe("POST /auth/login", function () {
		describe("Login with valid credentials (basic01)", function () {
			it("Responds with access token", function (done) {
				request(app)
					.post("/auth/login")
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
			it("Responds with access token", function (done) {
				request(app)
					.post("/auth/login")
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

		describe("Login with valid credentials (admin01)", function () {
			it("Responds with access token", function (done) {
				request(app)
					.post("/auth/login")
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

		describe("Login with valid credentials (super01)", function () {
			it("Responds with access token", function (done) {
				request(app)
					.post("/auth/login")
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

		describe("Login w/o password", function () {
			it("Responds with error message", function (done) {
				request(app)
					.post("/auth/login")
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
			it("Responds with error message", function (done) {
				request(app)
					.post("/auth/login")
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
			it("Responds with error message", function (done) {
				request(app)
					.post("/auth/login")
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
			it("Responds with error message", function (done) {
				request(app)
					.post("/auth/login")
					.send({ username: "basic01@gmail.com", password: "S3an12345" })
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(403);
						expect(body).to.be.property("password");
						done();
					})
					.catch((err: any) => done(err));
			});
		})
	})

	describe("GET /user", function () {
		describe("w/o accessToken", function() {
			it("Responds with error message", function (done) {
				request(app)
					.get("/user")
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

		describe("w/ accessToken (basic01)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get("/user")
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic01.username = body?.username;
						basic01.id = body?._id.toString();
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

		describe("w/ accessToken (basic02)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get("/user")
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
					.get("/user")
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
					.get("/user")
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

	describe("GET /users", function () {
		describe("as basic01", function () {
			it("Responds with list of users containing only username and createdAt properties", function (done) {
				request(app)
					.get("/users")
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
					.get("/users")
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
					.get("/users")
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
	
	describe("GET /users/:id", function () {
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

	describe("PATCH /user", function () {
		
		describe("Modify \"firstName\"", function() {	
			it("Responds with user info", function (done) {
				request(app)
				.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
					.send({ role: "admin" })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(403);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
				});
			})

			describe("admin", function() {
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
					.send({ role: "superuser" })
					.set("Authorization", `Bearer ${admin01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(403);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
				});
			});

			describe("superuser", function() {
				it("Responds with success message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with error message", function (done) {
					request(app)
					.patch("/user")
					.send({ verified: true })
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						expect(status).to.equal(403);
						expect(body).to.be.property("error");
						done();
					})
					.catch((err: any) => done(err));
				});
			})

			describe("admin", function() {
				it("Responds with success message", function (done) {
					request(app)
					.patch("/user")
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
				it("Responds with success message", function (done) {
					request(app)
					.patch("/user")
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

	describe("POST /auth/refresh", function () {
		describe("w/o refreshToken", function () {
			it("Responds with new access token", function (done) {
				request(app)
					.post("/auth/refresh")
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
					.post("/auth/refresh")
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

	describe("POST /auth/logout", function () {
		describe("Logout w/ invalid refresh token", function () {
			it("Responds with error message", function (done) {
				request(app)
					.delete("/auth/logout")
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
					.delete("/auth/logout")
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

	describe("DELETE /user as-", function () {
		describe("basic01", function() {
			it("Responds with success message", function (done) {
				request(app)
					.delete("/user")
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

		describe("basic02", function() {
			it("Responds with success message", function (done) {
				request(app)
					.delete("/user")
					.set("Authorization", `Bearer ${basic02.access_token}`)
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
			it("Responds with success message", function (done) {
				request(app)
					.delete("/user")
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
			it("Responds with success message", function (done) {
				request(app)
					.delete("/user")
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