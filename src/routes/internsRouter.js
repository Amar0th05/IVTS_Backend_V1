const express = require('express');
const multer = require('multer');
const { getAllIntern,downloadInternFile,createIntern } = require('../controllers/internsController');

const internsRouter = express.Router();

// Use memory storage (you can switch to diskStorage if you want to save files physically)
const storage = multer.memoryStorage();
const upload = multer({ storage });

internsRouter.get('/download/:id/:fileType', downloadInternFile);
internsRouter.get('/all',getAllIntern);
// Accept multiple file fields
internsRouter.post(
  '/',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'bonafide', maxCount: 1 },
  ]),
  createIntern
);

module.exports = {internsRouter} ;
