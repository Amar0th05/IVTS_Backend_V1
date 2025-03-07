const {getEquipmentList} = require("../controllers/EquipmentListController");
const router = require("express").Router();

router.get('/all',getEquipmentList);

module.exports = {equipmentListRouter: router};