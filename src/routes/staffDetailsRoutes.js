const {getAllStaffDetails, getUserById,addStaffDetails,toggleStaffStatus,getUserByIdWithoutJoin,updateStaffDetails,downloadAllStaffDetails,getMetadata,downloadDocument,deleteDocument,uploadDocument}=require('../controllers/staffDetailsController');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
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

router.get('/all',getAllStaffDetails);
router.get('/:id',getUserByIdWithoutJoin);
// router.post('/',addStaffDetails);
router.post('/', uploadFields, addStaffDetails);

router.put('/status/:id',toggleStaffStatus);
router.put('/',updateStaffDetails);
router.get('/download/all',downloadAllStaffDetails);
router.get('/:id/documents/metadata', getMetadata);
router.get('/:staffId/documents/:docName', downloadDocument);
router.delete('/:staffId/documents/:docName', deleteDocument);
router.post('/:staffId/documents/:docName', upload.single('file'), uploadDocument);

module.exports = {staffDetailsRouter: router};