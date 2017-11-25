const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const heroSchema = new Schema(
    {
        id: { type: Number, required: true, unique: true },
        Allday: Boolean,
        description: String,
        place : Array,
        end: String,
        start: String,
        title: String
    },
    {
        collection: 'Heroes'
    }
);

const Hero = mongoose.model('Hero', heroSchema);

module.exports = Hero;