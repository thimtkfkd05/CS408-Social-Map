const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        email: String,
        name: String,
        google_token: String
    },
    {
        collection: 'Users'
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
