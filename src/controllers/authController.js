const jwt = require('jsonwebtoken');
const { verify } = require('../Utils/hash');
const { getUser } = require('./UserController');
const {generateToken} = require('../Utils/jwtUtil');
const bcrypt = require('bcrypt');
require('dotenv').config();


async function login(req, res) {
    try {
        const { mail, password } = req.body;

        if (!mail) return res.status(400).json({ message: "Please provide mail" });
        if (!password) return res.status(400).json({ message: "Please provide password" });

        const user = await getUser(mail);
        if (!user || !user.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.status === false) {
            return res.status(401).json({ message: "User is not active" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken({ mail: user.mail, user });

        res.header('Authorization', `Bearer ${token}`);
        res.status(200).json({ user, message: "Login Successful" });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}



module.exports = {
    login
};
