// Create web server
// npm install express
// npm install body-parser
// npm install cors
// npm install mongoose
// npm install nodemon
// npm install dotenv
// npm install bcrypt
// npm install jsonwebtoken
// npm install express-validator

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

app.use(bodyParser.json());
app.use(cors());

const User = require('./models/User');
const Comment = require('./models/Comment');

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.log(error);
});

app.post('/register', [
    check('username', 'Please enter a valid username').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a valid password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let user = new User();
    user.username = req.body.username;
    user.email = req.body.email;
    user.password = bcrypt.hashSync(req.body.password, 10);

    try {
        await user.save();
        res.json({
            status: true,
            message: 'User created successfully'
        });
    } catch (error) {
        res.json({
            status: false,
            message: error
        });
    }
});

app.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.json({
            status: false,
            message: 'Authentication failed, user not found'
        });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.json({
            status: false,
            message: 'Authentication failed, wrong password'
        });
    }

    let token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '1