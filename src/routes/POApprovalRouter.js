const express = require('express');
const {createRecord, getRecordById} = require("../controllers/POApprovalController");
const router = express.Router();

router.post('/:id',createRecord);
router.get('/:id',getRecordById);

module.exports={POApprovalRouter:router};