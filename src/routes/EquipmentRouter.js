const equipmentRouter = require("express").Router();

const {createEquipment, updateTotalQuantity} = require("../controllers/EquipmentController");

equipmentRouter.post("/create", createEquipment);
equipmentRouter.put('/tq/:id',updateTotalQuantity);

module.exports = equipmentRouter;