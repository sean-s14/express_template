import { expect } from "chai";
import request from "supertest";

import { app } from "../../../app";
import { connect, close } from "../../__tests__/db";

describe("Authentication with JWT", function () {

	var access_token: any;

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
		it("Responds with Success Message", function (done) {
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

	describe("POST /auth/login", function () {
		it("Responds with Access Token", function (done) {
			request(app)
				.post("/auth/login")
				.send({ username: "basic01@gmail.com", password: "S3an1234" })
				.then((res: any) => {
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