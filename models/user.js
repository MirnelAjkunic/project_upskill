const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    googleId: String,
    isBoss: Boolean,
    firstName: String,
    lastName: String,
    emails: String,
    picture: String
})

const User = mongoose.model('users', userSchema)
module.exports = User
