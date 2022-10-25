const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        minLength: 1,
        maxLength: 20,
        required: true
    },
    userId: { 
        type: mongoose.Schema.ObjectId,
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


module.exports = mongoose.model('Item', itemSchema);

