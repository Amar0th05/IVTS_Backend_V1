const {getAllTalent, 
  getTalentById, 
  addTalent, 
  updateTalent,
  checkID,
  getMetadata,
  downloadDocument,
  uploadDocument,
  deleteDocument} = require('../controllers/TalentPool');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  {name: "resumeFile", maxCount: 1 },
  { name: "aadhaarFile", maxCount: 1 },
  { name: "panFile", maxCount: 1 },
  { name: "academicFile", maxCount: 1 },
  { name: "idCardFile", maxCount: 1 },
  { name: "certFile10", maxCount: 1 },
  { name: "certFile12", maxCount: 1 },
  { name: "certFileGMDSS", maxCount: 1 },
  { name: "certFileIALA", maxCount: 1 },
  { name: "otherCertFile", maxCount: 10 },
]);

router.get('/all',getAllTalent);
router.get('/:id',getTalentById);
router.get('/checkID/:id',checkID);
router.post('/', uploadFields, addTalent);

router.put('/',updateTalent);
router.get('/:id/documents/metadata', getMetadata);
router.get('/:personID/documents/:docName', downloadDocument);
router.delete('/:personID/documents/:docName', deleteDocument);
router.post('/:personID/documents/:docName',upload.single('file'), uploadDocument);

module.exports = {talentPoolRouter: router};
