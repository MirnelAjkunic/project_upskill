const express = require('express');
const app = express()
const mongoose = require('mongoose');
const cookieSession = require('cookie-session')
require('./config/passport-setup')
const passport = require('passport');
const keys = require('./config/keys')
const PORT = process.env.PORT||3000

mongoose.connect(keys.mongodb.dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('connected to db')
    })

app.use(cookieSession({
    name: 'session',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}))

app.use(express.static('public'))
app.use(passport.initialize())
app.use(passport.session())
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index', { user: req.user })
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('/')
})

app.listen(PORT, () => {
    console.log('server listening at 3000')
})
