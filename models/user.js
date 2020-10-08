const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    googleId: String,
    firstName: String,
    lastName: String,
    emails: String,
    profilePic: String,
    description: String,
    skillsProgress: Array,
    currentSkills: Array,
    bEinstieg: Date,
    birthday: Date,
    herkunft: String,
    location: String,
    social: Array,
    employees: Array
})

const User = mongoose.model('users', userSchema)
module.exports = User
