const express = require("express");
const cors = require("cors");
const ViewController = require("./controllers/ViewController");
const { sql, connectToDB } = require("./config/dbconfig");
const Designation = require("./models/Designation");
const DesignationController = require("./controllers/DesignationController");
const app = express();
const DesignationRoutes = require("./routes/DesignationRoutes");
const User = require("./models/User");
const bcrypt = require('bcrypt');
const UserController = require("./controllers/UserController");
const AuthController = require("./controllers/authController");
const {authRouter} = require("./routes/authRoutes");
const {resetPasswordRouter} = require("./routes/resetPasswordRoutes");

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL.toString(),
    exposedHeaders: ['Authorization']
}));

connectToDB();

app.use("/",authRouter);

app.use("/password",resetPasswordRouter);


module.exports = app;
