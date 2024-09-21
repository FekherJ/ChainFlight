import express from 'express';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { authenticated as customer_routes } from './router/auth_users.js';
import { general as genl_routes } from './router/general.js';

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

app.use("/insurance/auth", function auth(req, res, next) {
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
