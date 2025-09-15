const express = require('express');
const multer = require('multer');
const { getAllIntern, getInternById, getMetadata, downloadDocument,deleteDocument,uploadDocument,updateinternDetails,toggleInternStatus} = require('../controllers/internsController');

const internsRouter = express.Router();

// Use memory storage (you can switch to diskStorage if you want to save files physically)
const upload = multer({ storage: multer.memoryStorage() });
// const uploadFields = upload.fields([
//   { name: "BonafideFileData", maxCount: 1 },
//   { name: "ResumeFileData", maxCount: 1 },
//   { name: "PhotoFileData", maxCount: 1 },
//   { name: "IdProofFileData", maxCount: 1 },
// ]);


internsRouter.put('/:id',updateinternDetails);
internsRouter.get('/all',getAllIntern);
internsRouter.get('/:id', getInternById);
internsRouter.get('/:id/documents/metadata', getMetadata);
internsRouter.get('/:internId/documents/:docName', downloadDocument);
internsRouter.delete('/:internId/documents/:docName', deleteDocument);
internsRouter.post('/:internId/documents/:docName', upload.single('file'), uploadDocument);
internsRouter.put('/status/:id',toggleInternStatus);




module.exports = {internsRouter} ;
