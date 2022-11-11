import mongoose from "mongoose";

export interface I_Item {
    _id: mongoose.Types.ObjectId,
    title: string,
    userId: mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date,
}

const itemSchema = new mongoose.Schema({
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


export const Item = mongoose.model("Item", itemSchema);

