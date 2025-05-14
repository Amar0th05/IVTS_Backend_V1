const express=require('express');
const router=express.Router();
const multer=require('multer');
const {createRecord, getRecordById, downloadDocument} = require("../controllers/PoGeneratedController");
const storage=multer.memoryStorage();

const upload=multer({storage:storage});

router.post('/:id',upload.single('file'),createRecord);
router.get('/:id',getRecordById);
router.get('/download/:id',downloadDocument);


module.exports = {POGeneratedStageRouter:router};
