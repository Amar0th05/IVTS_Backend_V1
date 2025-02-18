const express = require("express");
const cors = require("cors");
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
const {getActiveStaff}=require('./controllers/staffDetailsController')
const {contractLogRouter}=require('./routes/contractLogRouter')
const{getAllActiveDesignations}=require('./controllers/DesignationController')

const{getAllRoles}=require('./controllers/rolesController');
const {authMiddleware}=require('./middlewares/authMiddleware');
const {userRouter} = require("./routes/userRoutes");

app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL.toString(),
    exposedHeaders: ['Authorization']
}));

app.use(logger);



app.use(async (req, res, next) => {
    if (!req.path.startsWith('/auth') && !req.path.startsWith('/password')) {
        try {
            await authMiddleware(req, res, next);
        } catch (error) {
            console.error("Authentication failed:", error);
            return res.status(401).json({ message: "Authentication failed" });
        }
    } else {
        next();
    }
});




app.use("/auth",authRouter);
app.use("/password",resetPasswordRouter);
app.use('/staff',staffDetailsRouter);
app.use('/courses',courseRouter);
app.use('/organisations',organizationRouter);
app.use('/hq',highestQualificationRouter);
app.use('/user',userRouter);

app.use('/cl',contractLogRouter);
app.get('/activestaffs/all',getActiveStaff);
app.get('/designations/active',getAllActiveDesignations);
app.get('/roles/all',getAllRoles);


module.exports = app;
