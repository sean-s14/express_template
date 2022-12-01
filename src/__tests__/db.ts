"use strict";

// ========== ENVIRONMENT VARIABLES ==========
import * as dotenv from "dotenv";
dotenv.config();
const env: any = process.env;

import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const DB_URI = env?.DEV_LOCAL_DATABASE ? env.DEV_LOCAL_DATABASE : env?.DEV_REMOTE_DATABASE;

import { Mockgoose } from "mockgoose";
const mockgoose = new Mockgoose(mongoose);

function connect() {
    return new Promise((resolve: any, reject: any) => {

        if (env.NODE_ENV === 'test') {
            mockgoose.prepareStorage().then(() => {
                mongoose.connect(DB_URI)
                    .then(() => {
                        resolve()
                    })
                    .catch(err => reject(err));
            })
        } else {
            mongoose.connect(DB_URI)
                .then(() => {
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