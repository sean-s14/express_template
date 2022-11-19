import mongoose from "mongoose";


export interface IToken {
    _id: mongoose.Types.ObjectId,
    access_token?: string,
    refresh_token: string,
    user: { type: mongoose.Types.ObjectId, required: boolean },
    createdAt: Date
    updatedAt: Date,
}

const tokenSchema = new mongoose.Schema<IToken>({
    access_token: { type: String, required: false },
    refresh_token: { type: String, required: true },
    // user: { type: mongoose.Schema.ObjectId, required: true },
    user: { type: mongoose.Types.ObjectId, required: true },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    updatedAt: {
        type: Date,
        default: () => Date.now(),
    },
});

export const Token = mongoose.model<IToken>("Token", tokenSchema);

