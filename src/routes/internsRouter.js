const express = require('express');
const multer = require('multer');
const { getAllIntern, getInternById, getMetadata, downloadDocument,deleteDocument,uploadDocument,updateinternDetails,toggleInternStatus,createIntern} = require('../controllers/internsController');

const internsRouter = express.Router();

// Use memory storage (you can switch to diskStorage if you want to save files physically)
const upload = multer({ storage: multer.memoryStorage() });


internsRouter.post(
  '/apply',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'bonafide', maxCount: 1 },
  ]),
  createIntern
);


internsRouter.put('/:id',updateinternDetails);
internsRouter.get('/all',getAllIntern);
internsRouter.get('/:id', getInternById);
internsRouter.get('/:id/documents/metadata', getMetadata);
internsRouter.get('/:internId/documents/:docName', downloadDocument);
internsRouter.delete('/:internId/documents/:docName', deleteDocument);
internsRouter.post('/:internId/documents/:docName', upload.single('file'), uploadDocument);
internsRouter.put('/status/:id',toggleInternStatus);




module.exports = {internsRouter} ;
