const express = require('express');
const router = express.Router();
const {getAllContractDetails, getContractById,updateContractLogs,addContractLog, getContractLogById}=require('../controllers/contractLogsController');



router.get('/all',getAllContractDetails);
router.get('/:id',getContractById);
router.post('/',addContractLog);
router.put('/',updateContractLogs);
router.get('/log/:id',getContractLogById);


module.exports = {contractLogRouter:router};