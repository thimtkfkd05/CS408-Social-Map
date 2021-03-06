const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const heroSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        Allday: Boolean,
        description: String,
        place : Object,
        end: String,
        start: String,
        title: String,
        user_id: Array,
        open: Boolean,
        url: String,
        open_day: String,
        close_day: String
    },
    {
        collection: 'Heroes'
    }
);

const Hero = mongoose.model('Hero', heroSchema);

module.exports = Hero;
