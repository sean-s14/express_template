"use strict";
import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import express from "express";
const app = express();

// ========== DEVELOPMENT SSL CERTIFICATE ==========
import fs from "fs";
import https from "https";
const privateKey  = fs.readFileSync(env.SSL_KEY_FILE, "utf8");
const certificate = fs.readFileSync(env.SSL_CRT_FILE, "utf8");
const credentials = {key: privateKey, cert: certificate};

import mongoose from "mongoose";
mongoose.set("strictQuery", false); // To ensure queries are not stripped of non-existent properties
import bodyParser from "body-parser"; // Convert the body of incoming requests into JavaScript objects
import cors from "cors"; // Add headers stating that your API accepts requests coming from other origins
import helmet from "helmet"; // Secure Express APIs by defining various HTTP headers
import morgan from "morgan"; // Adds some logging capabilities
import cookieParser from "cookie-parser";

// =============== DATABASE CONNECTION ===============
mongoose.connect(
        env?.DEV_LOCAL_DATABASE ? env.DEV_LOCAL_DATABASE : env?.DEV_REMOTE_DATABASE,
        // TODO: Set this to false when in production
        { autoIndex: false }
    )
    .then( () => console.log("MongoDB Connected..."))
    .catch( err => console.log(err));


// =============== MIDDLEWARE ===============
let whitelist = [env.CORS_WHITELIST]
let corsOptions = {
    origin: function (origin: any, callback: Function) {
        //   console.log("Origin:", origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    }
}
// app.use(cors(corsOptions));
app.use(cors({credentials: true, origin: env.CLIENT_URL}));
app.set("trust proxy", 1);
app.use(helmet()); // adding Helmet to enhance your API"s security
app.use(bodyParser.json()); // using bodyParser to parse JSON bodies into JS objects
app.use(morgan("combined")); // adding morgan to log HTTP requests
app.use(cookieParser(env.COOKIE_SECRET));

// =============== ROUTES ===============
import GoogleRoutes from "./src/auth/google/routes";
app.use("/google", GoogleRoutes);
import AuthRoutes from "./src/auth/method/jwt/routes/auth";
app.use("/auth", AuthRoutes);
import UserRoutes from "./src/auth/method/jwt/routes/user";
app.use("/user", UserRoutes);
import UsersRoutes from "./src/auth/method/jwt/routes/users";
app.use("/users", UsersRoutes);
import ItemsRoutes from "./src/routes/items";
app.use("/items", ItemsRoutes);


// =============== LISTENER ===============
https.createServer(credentials, app).listen(env.PORT, () => 
    console.log(`Listening at https://localhost:${env.PORT}`));