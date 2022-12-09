import { expect } from "chai";
import request from "supertest";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";

describe("Authentication with JWT", function () {

	var basic01: any = {
		access_token: "",
		refresh_token: "",
		username: "",
	}

	var basic02: any = {
		access_token: "",
		refresh_token: "",
		username: "",
	}

	before( done => {
		connect()
			.then(() => done())
			.catch((err) => done(err));
	})

	after( done => {
		close()
			.then(() => done())
			.catch((err) => done(err));
	})
	
	describe("POST /auth/signup", function () {
		describe("Signup w/ valid credentials (basic01)", function () {
			it("Responds with success message", function (done) {
				request(app)
					.post("/auth/signup")
					.send({ email: "basic01@gmail.com", password: "S3an1234", password2: "S3an1234" })
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
		describe("Using accessToken (basic01)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get("/user")
					.set("Authorization", `Bearer ${basic01.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic01.username = body?.username;
						expect(status).to.equal(200);
						expect(body).to.be.property("verified");
						expect(body).to.be.property("_id");
						expect(body).to.be.property("role");
						expect(body).to.be.property("username");
						expect(body).to.be.property("email");
						expect(body).to.be.property("createdAt");
						expect(body).to.be.property("updatedAt");
						done();
					})
					.catch((err: any) => done(err));
			});
		})

		describe("Using accessToken (basic02)", function() {
			it("Responds with user info", function (done) {
				request(app)
					.get("/user")
					.set("Authorization", `Bearer ${basic02.access_token}`)
					.then((res: any) => {
						const status = res.statusCode;
						const body = res.body;
						basic02.username = body?.username;
						expect(status).to.equal(200);
						expect(body).to.be.property("verified");
						expect(body).to.be.property("_id");
						expect(body).to.be.property("role");
						expect(body).to.be.property("username");
						expect(body).to.be.property("email");
						expect(body).to.be.property("createdAt");
						expect(body).to.be.property("updatedAt");
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

			// TODO: describe("admin", function() {});
			// TODO: describe("superuser", function() {});
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
				.set("Cookie", basic01.refresh_token)
				.then((res: any) => {
					const status = res.statusCode;
					expect(status).to.equal(204);
					done();
				})
				.catch((err: any) => done(err));
			});
		})
	})

	describe("DELETE /user", function () {
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

})