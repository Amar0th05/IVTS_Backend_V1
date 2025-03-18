const equipmentRouter = require("express").Router();

const {createEquipment} = require("../controllers/EquipmentController");

equipmentRouter.post("/create", createEquipment);

module.exports = equipmentRouter;