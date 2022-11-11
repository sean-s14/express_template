import mongoose from "mongoose";
import { ROLES } from "../utils/permissions/roles.js";

const userSchema = new mongoose.Schema({
    role: { type: String, default: ROLES.BASIC },
    username: {
        type: String,
        index: { unique: true, sparse: true },
        // unique: true,
        minLength: 4,
        maxLength: 50
    },
    email: { 
        type: String, 
        index: { unique: true, sparse: true },
        // unique: true,
        lowercase: true,
        minLength: 3,
        maxLength: 100,
    },
    verified: { type: Boolean, default: false },
    password: String,
    firstName:  {
        type: String,
        minLength: 1,
        maxLength: 50
    },
    lastName:  {
        type: String,
        minLength: 1,
        maxLength: 50
    },
    birth_date: Date,
    photo: { type: String },
    googleId: { type: String },
    githubId: { type: String },
    facebookId: { type: String },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    updatedAt: { type: Date, default: () => Date.now() },
});


// const User = mongoose.model("User", userSchema);
export default mongoose.model("User", userSchema);

