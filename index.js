<<<<<<<< HEAD:index.js
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Decentralized Insurance Platform API!');
});


// Update session route for insurance platform
app.use("/insurance", session({
    secret: "insurance_secret", 
    resave: true, 
    saveUninitialized: true
}));

app.use("/insurance/auth", function auth(req,res,next){
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }

});
 
app.use("/insurance", customer_routes);
app.use("/", genl_routes);

const PORT =5000;
app.listen(PORT,()=>console.log("Server is running on port 5000"));
========
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Decentralized Insurance Platform API!');
});


// Update session route for insurance platform
app.use("/insurance", session({
    secret: "insurance_secret", 
    resave: true, 
    saveUninitialized: true
}));

app.use("/insurance/auth", function auth(req,res,next){
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }

});
 
app.use("/insurance", customer_routes);
app.use("/", genl_routes);

const PORT =5000;
app.listen(PORT,()=>console.log("Server is running on port 5000"));
>>>>>>>> e3c5a5d (Initial commit):repo/decentralized-insurance-platform/index.js
