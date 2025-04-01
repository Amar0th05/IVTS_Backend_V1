const express = require('express');
const ProjectTrackingRouter = express.Router();
const { getAllProjects,getProjectById,createProject,updateProject } = require('../controllers/ProjectTrackingController');

ProjectTrackingRouter.get("/all",getAllProjects);
ProjectTrackingRouter.get("/:id",getProjectById);
ProjectTrackingRouter.post("/",createProject);
ProjectTrackingRouter.put("/",updateProject);

module.exports = {ProjectTrackingRouter}