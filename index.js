const express = require('express');
const app = express()
const mongoose = require('mongoose');
const cookieSession = require('cookie-session')
require('./config/passport-setup')
const passport = require('passport');
const keys = require('./config/keys')
const PORT = process.env.PORT || 3000
const User = require('./models/user')

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
    if (req.user == undefined) {
        res.render('index', { user: req.user })
    } else {
        console.log(req.user);
        res.redirect('/user/menu/' + req.user._id)
    }
})

app.get('/user/menu/:id', (req, res) => {
    res.render('menu', { user: req.user })
})

app.get('/user/mypage/:id', (req, res) => {
    res.render('mypage', { user: req.user })
})

app.get('/course/:id/:coursename', (req, res) => {
    res.render('course', { user: req.user, coursename: req.params.coursename })
})

app.get('/start/:id/:coursename/:chapter', async (req, res) => {
    let doc = await User.findOne({ _id: req.params.id })
    let update = []
    if (doc.skillsProgress != undefined) {
        update = doc.skillsProgress
    }
    update.push({
        chapter: req.params.chapter,
        start: new Date()
    })
    console.log(update);
    let update1 = { $set: { skillsProgress: update } }
    console.log(update1);
    User.findOneAndUpdate({ _id: req.params.id }, update1, { new: true, useFindAndModify: true })
        .then(result => {
            console.log(result);
        })
        .catch(err => console.error(`Failed to find and update document: ${err}`))
    res.redirect('https://www.udemy.com/de/')
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
