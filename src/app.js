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

const {userRolesRouter}=require('./routes/RoleRoutes');
const{getAllRoles}=require('./controllers/rolesController');
const {authMiddleware}=require('./middlewares/authMiddleware');
const {userRouter} = require("./routes/userRoutes");
const {designationRouter} = require("./routes/DesignationRoutes");
const {DashBoardRouter} = require("./routes/DashBoardRoutes");
const{equipmentListRouter}=require('./routes/equipmentListRoutes');
const {procurementRouter} = require("./routes/ProcurementRoutes");
const {stageRouter} = require("./routes/StagesRoutes");
const {equipmentDeliveryRouter} = require("./routes/EquipmentDeliveryRoutes");
const equipmentCategoryRoutes = require("./routes/EquipmentCategoryRoutes");
const equipmentListRoutes = require("./routes/EquipmentListRoutes");
const equipmentRouter=require("./routes/EquipmentRouter");
const {employeeInsuranceRouter} = require("./routes/insuranceRouter");
const {OAndMRouter} = require("./routes/o&mInvoiceRoutes");

const {equipmentInvoiceRouter} = require("./routes/equipmentInvoiceRoutes");


app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL.toString(),
    exposedHeaders: ['Authorization']
}));

app.use(logger);

connectToDB();

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
app.use('/roles',userRolesRouter);
app.use('/dashboard',DashBoardRouter);
app.use('/el',equipmentListRouter);
app.use('/procurements',procurementRouter);
app.use('/stages',stageRouter);
app.use('/equipmentsDelivery',equipmentDeliveryRouter);
app.use('/insurance',employeeInsuranceRouter);

app.use("/equipmentCategories",equipmentCategoryRoutes);

app.use('/equipmentInvoice',equipmentInvoiceRouter);
app.use("/equipments",equipmentRouter);
app.use("/om",OAndMRouter);

app.use('/designations',designationRouter);
app.use('/cl',contractLogRouter);
app.get('/activestaffs/all',getActiveStaff);
app.get('/designations/active',getAllActiveDesignations);
// app.get('/roles/all',getAllRoles);


module.exports = app;
