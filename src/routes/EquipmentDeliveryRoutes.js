const express = require('express');
const {
    getAllEquipmentDeliveries,
    getEquipmentDeliveryById,
    createEquipmentDelivery,
    updateEquipmentDelivery,
    deleteEquipmentDelivery,
    getAllEquipmentsForPort
} = require('../controllers/equipmentDeliveryController');

const equipmentDeliveryRouter = express.Router();

equipmentDeliveryRouter.get('/', getAllEquipmentDeliveries);
equipmentDeliveryRouter.get('/:id', getEquipmentDeliveryById);
equipmentDeliveryRouter.post('/', createEquipmentDelivery);
equipmentDeliveryRouter.put('/:id', updateEquipmentDelivery);
equipmentDeliveryRouter.delete('/:id', deleteEquipmentDelivery);
equipmentDeliveryRouter.get('/port/:id', getAllEquipmentsForPort);

module.exports = { equipmentDeliveryRouter };
