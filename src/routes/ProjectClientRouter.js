const ProjectClientController = require("../controllers/ProjectClientsController");

const ProjectClientRouter=require('express').Router();

ProjectClientRouter.get('/all/active',ProjectClientController.getAllActiveClients);
ProjectClientRouter.get('/all',ProjectClientController.getAllClients);
ProjectClientRouter.get("/:id",ProjectClientController.getClientById);
ProjectClientRouter.put("/status/:id",ProjectClientController.toggleStatus);
ProjectClientRouter.put('/:id',ProjectClientController.updateClient);
ProjectClientRouter.post('/', ProjectClientController.createClient);    

module.exports={ ProjectClientRouter }