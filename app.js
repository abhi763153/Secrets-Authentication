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
const GoogleStrategy = require("passport-google-oauth20").Strategy; 
const findOrCreate = require("mongoose-findorcreate");

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
    password : String,
    googleId : String
});

userDocSchema.plugin(passportLocalMongoose);
userDocSchema.plugin(findOrCreate);
 
// let secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
// userDocSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields:['password']});

const User = new mongoose.model("User", userDocSchema);
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser((user, done)=>{
    done(null, user.id);
});
passport.deserializeUser((id, done)=>{
    User.findById(id, (err, user)=>{
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), (req, res)=>{
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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


app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/");
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