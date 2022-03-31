//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");

const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


mongoose.connect("mongodb://localhost:27017/userDB");

const userDocSchema = new mongoose.Schema({
    email : String,
    password : String
});

// let secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
// userDocSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields:['password']});

const User = new mongoose.model("User", userDocSchema);


app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.post("/register", (req, res)=>{
    
    bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
        
        const newUser = new User({
            email: req.body.username, 
            password: hash  // md5(req.body.password)
        });
    
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }
            else{
                res.render("secrets");
            }
        });
    });


    
});

app.post("/login", (req, res)=>{

    const username = req.body.username;
    const password = req.body.password;

    

    User.findOne({email : username}, (err, foundUser)=>{

        if(!err){
            if(foundUser){
                bcrypt.compare(password, foundUser.password, (err, result)=>{
                    if(!err){
                        if(result){
                            res.render("secrets");
                        }
                        else{
                            console.log("Password does not match !!!");
                        }
                    }
                    else{
                        console.log(err);
                    }
                });
            }
        }
        else{
            console.log(err);
        }
       

       
    });
});





app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})