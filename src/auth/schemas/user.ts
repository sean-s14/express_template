import mongoose from "mongoose";
import { ROLES } from "../permissions/roles";

export interface IUser {
    _id: mongoose.Types.ObjectId,
    role?: string,
    username?: { type: string, index: object, minLength: number, maxLength: number},
    email?: { type: string, index: object, lowercase: boolean, minLength: number, maxLength: number},
    verified?: boolean,
    password?: string,
    firstName?: string,
    lastName?: string,
    birth_date?: Date,
    photo?: string,
    googleId?: string,
    githubId?: string,
    facebookId?: string,
    createdAt: Date
    updatedAt: Date,
}


const userSchema = new mongoose.Schema<IUser>({
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


export const User = mongoose.model<IUser>("User", userSchema);
