import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true 
    }
})

const Board = mongoose.model('Board', boardSchema)

export {Board}