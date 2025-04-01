const ProjectClientController = require("../controllers/ProjectClientsController");

const ProjectClientRouter=require('express').Router();

ProjectClientRouter.get('/all/active',ProjectClientController.getAllActiveClients);

module.exports={ ProjectClientRouter }