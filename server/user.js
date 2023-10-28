const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', UserSchema);
exports.User = User;