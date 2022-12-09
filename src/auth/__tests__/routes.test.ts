import { expect } from "chai";
import request from "supertest";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";

describe("Authentication with JWT", function () {

	var access_token: any;
	var refresh_token: any;

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
		describe("Signup w/ valid credentials", function () {
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
		describe("Login with valid credentials", function () {
			it("Responds with access token", function (done) {
				request(app)
					.post("/auth/login")
					.send({ username: "basic01@gmail.com", password: "S3an1234" })
					.then((res: any) => {
						refresh_token = res.headers["set-cookie"]; // Contains refresh token in "set-cookie"
						const status = res.statusCode;
						const body = res.body;
						access_token = res.body["accessToken"] || null;
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
		it("Responds with User Info", function (done) {
			request(app)
				.get("/user")
				.set("Authorization", `Bearer ${access_token}`)
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
					done();
				})
				.catch((err: any) => done(err));
		});
	})

	describe("PATCH /user", function () {
		it("Responds with User Info", function (done) {
			request(app)
				.patch("/user")
				.send({ firstName: "Sean" })
				.set("Authorization", `Bearer ${access_token}`)
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
				.set("Cookie", refresh_token)
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
		it("Responds with Success Message", function (done) {
			request(app)
				.delete("/user")
				.set("Authorization", `Bearer ${access_token}`)
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


	// it("Fail, note requires text", (done) => {
	//   request(app).post("/notes")
	//     .send({ name: "NOTE" })
	//     .then((res) => {
	//       const body = res.body;
	//       expect(body.errors.text.name)
	//         .to.equal("ValidatorError")
	//       done();
	//     })
	//     .catch((err) => done(err));
	// });
})