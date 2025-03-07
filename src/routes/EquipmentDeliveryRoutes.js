const express = require('express');
const {
    getAllEquipmentDeliveries,
    getEquipmentDeliveryById,
    createEquipmentDelivery,
    updateEquipmentDelivery,
    deleteEquipmentDelivery
} = require('../controllers/equipmentDeliveryController');

const equipmentDeliveryRouter = express.Router();

equipmentDeliveryRouter.get('/', getAllEquipmentDeliveries);
equipmentDeliveryRouter.get('/:id', getEquipmentDeliveryById);
equipmentDeliveryRouter.post('/', createEquipmentDelivery);
equipmentDeliveryRouter.put('/:id', updateEquipmentDelivery);
equipmentDeliveryRouter.delete('/:id', deleteEquipmentDelivery);

module.exports = { equipmentDeliveryRouter };
