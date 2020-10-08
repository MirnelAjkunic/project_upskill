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
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
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
    res.render('mypage', { user: req.user, isBoss: false })
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

app.get('/boss/mypage/:id', (req, res) => {
    res.render('boss', { user: req.user })
})

app.get('/boss/employees/:id', async (req, res) => {
    let doc = await User.findOne({ _id: req.params.id })
    console.log(doc);
    res.render('mypage', { user: doc, isBoss: true })
})

app.post('/boss/add', async (req, res) => {
    let boss = await User.findOne({ _id: req.user.id })
    let employees = await User.findOne({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emails: req.body.emails
    })
    if (employees != null) {
        let update = []
        if (boss.employees != undefined) {
            update = boss.employees
        }
        update.push({
            _id : employees._id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            emails: employees.emails,
            profilePic: employees.picture
        })
        console.log(update);
        let update1 = { $set: { employees: update } }
        console.log(update1);
        await User.findOneAndUpdate({ _id: req.user.id }, update1, { new: true, useFindAndModify: true })
            .then(result => {
                console.log(result);
            })
            .catch(err => console.error(`Failed to find and update document: ${err}`))
    }
    res.redirect(`/boss/mypage/${req.user._id}`)
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.redirect('/')
})

app.get('/auth/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

app.listen(PORT, () => {
    console.log('server listening at 3000')
})
