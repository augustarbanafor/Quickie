const express = require('express');
const app = express()

const mongoose = require('mongoose')
const User = require('./model/user')
const morgan = require('morgan');

const dotenv = require('dotenv').config()
const{DB_PASSWORD, PORT} = process.env
const port = PORT || 6000
const bcryptjs = require('bcryptjs')
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', 'views')
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}))
app.use(session({
    name: 'SESS_NAME',
    resave: false,
    secret: 'SEC_SECRET',
    saveUninitailized: false,
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
  cookie: {
      maxAge: 86400,
      sameSite: true
           }  
    }))

//Connection to DataBase
const dbString = `mongodb+srv://augustarbanafor:${DB_PASSWORD}@cluster0.quhlebp.mongodb.net/ProjectT3?retryWrites=true&w=majority`
mongoose.connect(dbString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then((result) => {
    app.listen(port, ()=>{
        console.log(`listening on ${PORT}`)
    })
})
.catch((err) => {console.log(err)})

app.get('/add-profile', (req, res) => {
    const user = new User({
        name: 'name',
        email: 'email',
        password: 'agi1'
    })
})


//POST END-POINT
app.post('/Sign-up', async(req, res) => {
    console.log(req.body)
    const errMessages = []
    if(!req.body.full_name){
      errMessages.push('please full name is required')
    }  
    if(!req.body.email){
        errMessages.push('please email is required')
    } 
    if(!req.body.password){
        errMessages.push('please full name is required')
    } 
    if(req.body.password !== req.body.confirm_password){
        errMessages.push('password and confirm password do not match')
    }
    if(errMessages.length > 0){
        return res.render('sign-up', {title: 'Sign up', errors: errMessages })
    }
    else{
        const{ full_name, password } = req.body;
        const existingUser = await User.findOne({full_name: full_name})
        if(existingUser){
            return res.render('sign-up', {
                title: 'SignUp',
                errors: ['a user with the username already exists!'],
                user: null
            })
        }
        const salt = await bcryptjs.genSalt(10);
        req.body.password = await bcryptjs.hash(req.body.password, salt);
        const user = new User({
            full_name: req.body.full_name,
            email: req.body.email,
            password: req.body.password
        })
        await user.save().then(()=> {
           
        }).catch((err)=> {
            console.log(err)
        })
        req.session.user_id = user._id;
        res.redirect('/profile');
    }
})

app.post('/login', async (req, res)=>{
    console.log(req.body)
    const foundUser = await User.findOne({email: req.body.email});
    const isValid = await bcryptjs.compare(req.body.password, foundUser.password);
    if(isValid) {
        req.session.user_id = foundUser._id;
        // console.log('hello')
        res.redirect('/profile');
    }
    else{
        res.render('login', {errors: ['Invalid credentials!'], user: null});
    }
})


app.get('/', (req, res) =>{
    res.render('home', {title: 'Home'});
})
app.get('/sign-up', (req, res) =>{
    res.render('sign-up', {title: 'Sign Up', errors: null});
})
app.get('/login', (req, res) =>{
    res.render('login', {title: 'Login'});
})
app.get('/profile', async (req, res) =>{
    if(!req.session.user_id) {
      return res.redirect('/login')
    }
    
    const user  = await User.findById(req.session.user_id)
    return res.render('profile', {title: 'Personal Profile', user:  user});
})
app.use((req, res) => {
    res.status(404).render('404', {title: 'Error: 404!'});
})

