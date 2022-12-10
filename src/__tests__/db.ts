"use strict";

// ========== ENVIRONMENT VARIABLES ==========
import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const DB_URI = env?.DEV_LOCAL_TEST_DATABASE;

function connect() {
    return new Promise((resolve: any, reject: any) => {
        if (env.NODE_ENV === 'test') {
            mongoose.connect(DB_URI)
                .then( async () => {
                    console.log("Test MongoDB Connected...")
                    resolve()
                })
                .catch(err => reject(err));
        }
    });
}

function close() {
    return mongoose.disconnect();
}

export { connect, close };