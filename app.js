require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const auth = require("./middleware/auth");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html');
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + '/static/register.html');
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + '/static/login.html');
});

app.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        if(!(email && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }

        const oldUser = await User.findOne({ email });
        if(!!oldUser) {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='/register'>Register again</a></div>");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            email,
            password: encryptedPassword,
        });

        const token = jwt.sign(
            {
                user_id: user._id,
                email
            },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        user.password = undefined;
        user.token = token;

        res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='/login'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");

    } catch(err) {
        console.log(err);
    }

});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!(email && password)) {
            res.status(400).send("All input is required");
        }
        const user = await User.findOne({ email });

        if(user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {
                    user_id: user._id,
                    email
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );

            user.password = undefined;
            // user.token = token;
            res.cookie('token', token, {
                expires: new Date(Date.now() + "2h"),
                secure: false,
                httpOnly: true,
            });
            res.redirect('/home');
        }
        res.status(400).send("Invalid Credentials");
    } catch(err) {
        console.log(err);
    }
});

app.get("/home", auth, (req, res) => {
    res.sendFile(__dirname + '/static/home.html');
    // res.status(200).send("Welcome 🙌 ");
});

module.exports = app;