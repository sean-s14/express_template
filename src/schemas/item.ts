import mongoose from "mongoose";

export interface I_Item {
    _id: mongoose.Types.ObjectId,
    title: { type: string, minLength: 1, maxLength: 20, required: true },
    userId: { type: mongoose.Types.ObjectId, required: true },
    createdAt: Date,
    updatedAt: Date,
}

const itemSchema = new mongoose.Schema<I_Item>({
    title: {
        type: String,
        minLength: 1,
        maxLength: 20,
        required: true
    },
    userId: { 
        type: mongoose.Types.ObjectId,
        required: true
    },
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


export const Item = mongoose.model<I_Item>("Item", itemSchema);

