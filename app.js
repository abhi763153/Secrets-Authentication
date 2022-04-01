//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret : "Our little secret",
    resave : false,
    saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

const userDocSchema = new mongoose.Schema({
    email : String,
    password : String
});

userDocSchema.plugin(passportLocalMongoose);
 
// let secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
// userDocSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields:['password']});

const User = new mongoose.model("User", userDocSchema);
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username, active: false}, req.body.password, function(err, user) {
        if (err) {  
            console.log(err);
        }
        const authenticate = User.authenticate();
        authenticate(user.username, req.body.password, function(err, result) {
            if (err) {
                console.log(err);
            }   
            else{
                res.render("secrets");
            }
            // Value 'result' is set to false. The user could not be authenticated since the user is not active
          });
      });
       
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/login" }), (req, res)=>{

    res.redirect('/secrets');

});





app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})