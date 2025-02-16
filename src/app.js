const express = require("express");
const cors = require("cors");
require("./controllers/ViewController");
const {connectToDB } = require("./config/dbconfig");
require("./models/Designation");
require("./controllers/DesignationController");
const app = express();
require("./routes/DesignationRoutes");
const {authRouter} = require("./routes/authRoutes");
const {resetPasswordRouter} = require("./routes/resetPasswordRoutes");
const {logger}=require('./middlewares/logger');
const {staffDetailsRouter} = require("./routes/staffDetailsRoutes");
const {courseRouter} = require("./routes/courseRoutes");
const {organizationRouter}=require("./routes/organisationRoutes");
const {highestQualificationRouter} = require("./routes/highestQualificationRoutes");

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL.toString(),
    exposedHeaders: ['Authorization']
}));

app.use(logger);

connectToDB();

app.use("/",authRouter);

app.use("/password",resetPasswordRouter);
app.use('/staff',staffDetailsRouter);
app.use('/courses',courseRouter);
app.use('/organisations',organizationRouter);
app.use('/hq',highestQualificationRouter);


module.exports = app;
