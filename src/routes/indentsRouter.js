const express = require('express');
const multer = require('multer');

const indentsRouter = express.Router();
const { createIndent, getBasicIndentDetails ,getIndentById,downloadDocument, updateIndent, getTest,
    getWaitingDaysForIndents
} = require('../controllers/indentsController');


const storage = multer.memoryStorage();
const upload = multer({ storage });


indentsRouter.post('/', upload.single('supportDoc'), createIndent);
indentsRouter.get('/basic',getBasicIndentDetails);
indentsRouter.get('/:id',getIndentById);
indentsRouter.get('/download/:id',downloadDocument);
indentsRouter.put('/:id',upload.single('file'),updateIndent);
indentsRouter.get('/test/:id',getTest);
indentsRouter.get('/stages/wt',getWaitingDaysForIndents);

module.exports = { indentsRouter };
