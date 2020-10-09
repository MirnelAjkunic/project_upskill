require('dotenv').config()
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport')
const User = require('../models/user')
const keys = require('./keys')
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy(
    {
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret,
        callbackURL: "http://localhost:3000/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
        User.find({ googleId: profile.id })
            .then(user => {
                if (user.length > 0) {
                    done(null, user)
                } else {
                    new User({
                        googleId: profile.id,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        emails: profile.emails[0].value,
                        picture: profile.photos[0].value
                    }).save().then(() => {
                        done(null, user)
                    })
                }
            })
    }
))
