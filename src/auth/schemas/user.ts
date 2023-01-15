import mongoose from "mongoose";
import { ROLES } from "../permissions/roles";
import { generateUsername2 } from "../utils/auth";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  role: string;
  username: {
    type: string;
    index: object;
    minLength: number;
    maxLength: number;
  };
  email: { type: string; require: boolean; index: object; lowercase: boolean };
  verified?: boolean;
  code: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  birth_date?: Date;
  photo?: string;
  googleId?: string;
  githubId?: string;
  facebookId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  role: { type: String, default: ROLES.BASIC },
  username: {
    type: String,
    index: { unique: true, sparse: true },
    // unique: true,
    minLength: 4,
    maxLength: 50,
  },
  email: {
    type: String,
    require: true,
    index: { unique: true, sparse: true },
    // unique: true,
    lowercase: true,
  },
  verified: { type: Boolean, default: false },
  code: { type: String, default: "" },
  password: String,
  firstName: {
    type: String,
    minLength: 1,
    maxLength: 50,
  },
  lastName: {
    type: String,
    minLength: 1,
    maxLength: 50,
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

userSchema.pre("validate", async function (next) {
  if (this !== undefined) {
    if (!this.username) {
      const generated_username = await generateUsername2();
      if (generated_username !== undefined) {
        // @ts-ignore
        this.username = generated_username;
      } else {
        next(new Error("A username could not be generated"));
      }
    }
  }
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  // @ts-ignore
  if (update?.username && update.username.includes("@")) {
    next(new Error("Usernames cannot contain the '@' symbol"));
  }
  next();
});

export const User = mongoose.model<IUser>("User", userSchema);
