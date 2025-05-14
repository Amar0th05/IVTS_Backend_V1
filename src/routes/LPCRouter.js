const LPCRouter = require('express').Router();
const {createRecord, getRecordById, downloadDocument}=require('../controllers/LPCController');
const multer = require('multer');
const storage=multer.memoryStorage();
const upload = multer({ storage });

LPCRouter.post('/:id',upload.single('file'),createRecord);
LPCRouter.get('/:id',getRecordById);
LPCRouter.get('/download/:id',downloadDocument);

module.exports= {LPCRouter};