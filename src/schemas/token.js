import mongoose from "mongoose";


const tokenSchema = new mongoose.Schema({
    access_token: { type: String, required: false },
    refresh_token: { type: String, required: true },
    user: { type: mongoose.Schema.ObjectId, required: true },
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

export default mongoose.model("Token", tokenSchema);

