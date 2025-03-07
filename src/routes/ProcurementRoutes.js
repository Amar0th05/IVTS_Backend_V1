const router = require("express").Router();

const{createProcurement,updateProcurement}=require('../controllers/ProcurementController');

router.post('/',createProcurement);
router.put('/:id',updateProcurement);

module.exports={procurementRouter:router};