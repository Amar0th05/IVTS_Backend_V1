const express = require('express');
const ProjectTrackingRouter = express.Router();
const multer=require('multer');

const upload = multer();

const { getAllProjects,getProjectById,createProject,updateProject, getStatusCounts, getProjectPaidStatus,getProjectIncharge} = require('../controllers/ProjectTrackingController');
ProjectTrackingRouter.get('/getProjectIncharge', getProjectIncharge);
ProjectTrackingRouter.get("/all",getAllProjects);
ProjectTrackingRouter.get("/:id",getProjectById);
ProjectTrackingRouter.post("/",upload.any(),createProject);
ProjectTrackingRouter.put("/",updateProject);
ProjectTrackingRouter.get('/all/status',getStatusCounts);
ProjectTrackingRouter.get('/all/payment/status',getProjectPaidStatus);

module.exports = {ProjectTrackingRouter}