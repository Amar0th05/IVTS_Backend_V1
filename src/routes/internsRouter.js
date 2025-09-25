const express = require('express');
const multer = require('multer');
const {
  getAllIntern,
  getInternById,
  getMetadata,
  downloadDocument,
  deleteDocument,
  uploadDocument,
  updateinternDetails,
  toggleInternStatus,
  createIntern
} = require('../controllers/internsController');

const internsRouter = express.Router();

// Multer in memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Apply internship
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

// Update intern details (including files if uploaded)
internsRouter.put(
  '/:id',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'bonafide', maxCount: 1 }
  ]),
  updateinternDetails
);

// Other routes
internsRouter.get('/all', getAllIntern);
internsRouter.get('/:id/documents/metadata', getMetadata);
internsRouter.get('/:internId/documents/:docName', downloadDocument);
internsRouter.delete('/:internId/documents/:docName', deleteDocument);
internsRouter.post('/:internId/documents/:docName', upload.single('file'), uploadDocument);
internsRouter.put('/status/:id', toggleInternStatus);
internsRouter.get('/:id', getInternById);

module.exports = { internsRouter };
