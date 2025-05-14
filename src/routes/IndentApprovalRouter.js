const express = require('express');
const indentApprovalRouter = express.Router();

const multer = require('multer');
const {createRecord, getRecordById,downloadDocument} = require("../controllers/IndentApprovalController");
const storage=multer.memoryStorage();
const upload=multer({storage:storage});

indentApprovalRouter.post('/:id',upload.single('file'),createRecord);
indentApprovalRouter.get('/:id',getRecordById);
indentApprovalRouter.get('/download/:id',downloadDocument);

module.exports= {indentApprovalRouter};