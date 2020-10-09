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
        let object = {}
        object._id = "guest"
        res.render('menu', { user: object, headerKey:"menu" })
    } else {
        res.redirect('/user/menu/' + req.user._id)
    }
})

app.get('/user/menu/:id', (req, res) => {
    res.render('menu', { user: req.user, headerKey:"menu" })
})

app.get('/user/mypage/:id', (req, res) => {
    if (req.params.id == 'guest') {
        res.redirect('/')
    }
    let birth = ''
    if (req.user.birthday != undefined) {
        let heute = new Date()
        let heuteY = heute.getFullYear()
        birth = req.user.birthday.getFullYear()
        birth = heuteY - birth
    }
    res.render('mypage', { user: req.user, isBoss: false, birth, headerKey:"mypage" })
})

app.post('/user/update', async (req, res) => {
    console.log("FORM   :", req.body)
    let update = {}
    if (req.body.job != '') update.job = req.body.job
    if (req.body.description != '') update.description = req.body.description
    if (req.body.bEinstieg != '') {
        update.bEinstieg = req.body.bEinstieg
        update.bEinstiegStr = String(req.body.bEinstieg)
    }
    if (req.body.birthday != '') {
        update.birthday = req.body.birthday
        update.birthdayStr = String(req.body.birthday)
    }
    if (req.body.herkunft != '') update.herkunft = req.body.herkunft
    if (req.body.location != '') update.location = req.body.location
    update.currentSkills = []
    for (let i = 0; i < req.body["skilltitle[]"].length; i++) {
        if (req.body["skilltitle[]"][i] != '' && req.body["skilllevel[]"][i] != '') {
            update.currentSkills.push({
                title: req.body["skilltitle[]"][i],
                level: req.body["skilllevel[]"][i]
            })
        }
    }
    update.social = []
    for (let i = 0; i < req.body["socialtitle[]"].length; i++) {
        if (req.body["socialtitle[]"][i] != '' && req.body["socialurl[]"][i] != '') {
            update.social.push({
                title: req.body["socialtitle[]"][i],
                url: req.body["socialurl[]"][i]
            })
        }
    }
    let update1 = { $set: update }
    User.findOneAndUpdate({ _id: req.user.id }, update1, { new: true, useFindAndModify: false })
        .then(result => {
            res.redirect('/user/mypage/' + req.user._id)
        })
        .catch(err => console.error(`Failed to find and update document: ${err}`))
})

app.get('/course/:id/:coursename', (req, res) => {
    res.render('course', { user: req.user, coursename: req.params.coursename, headerKey:"course" })
})

app.get('/start/:id/:coursename/:chapter', async (req, res) => {
    if (req.params.id == "guest") {
        res.redirect('/auth/google')
        return
    }
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
    User.findOneAndUpdate({ _id: req.params.id }, update1, { new: true, useFindAndModify: false })
        .then(result => {
            console.log(result);
        })
        .catch(err => console.error(`Failed to find and update document: ${err}`))
    res.redirect('/')
})

app.get('/employees', (req, res) => {
    res.render('employees', { user: req.user, headerKey:"mypage" })
})

app.get('/boss/mypage/:id', (req, res) => {
    if (req.user == undefined) {
        let object = {}
        object.firstName = "Guest"
        object._id = "guest"
        res.render('boss', { user: object, headerKey:"boss" })
    } else {
        res.render('boss', { user: req.user, headerKey:"boss" })
    }
})

app.get('/boss/employees/:id', async (req, res) => {
    let doc = await User.findOne({ _id: req.params.id })
    let birth = ''
    if (doc.birthday != undefined) {
        let heute = new Date()
        let heuteY = heute.getFullYear()
        birth = doc.birthday.getFullYear()
        birth = heuteY - birth
    }
    res.render('mypage', { user: doc, isBoss: true, birth, headerKey:"mypage" })
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
            _id: employees._id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            emails: employees.emails,
            profilePic: employees.profilePic
        })
        console.log(update);
        let update1 = { $set: { employees: update } }
        console.log(update1);
        await User.findOneAndUpdate({ _id: req.user.id }, update1, { new: true, useFindAndModify: false })
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

