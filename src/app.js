const express = require("express");
const cors = require("cors");
const ViewController = require("./controllers/ViewController");
const { sql, connectToDB } = require("./config/dbconfig");
const Designation = require("./models/Designation");
const DesignationController = require("./controllers/DesignationController");
const app = express();
const DesignationRoutes = require("./routes/DesignationRoutes");

app.use(express.json());
app.use(cors());


connectToDB();


app.use("/designations", DesignationRoutes);

module.exports = app;
