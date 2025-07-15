// vendorRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  getAllActiveVendors,
  getAllVendors,
  createVendor,
  downloadBankDocument,
  replaceBankDocument
} = require('../controllers/vendorsController');

// Routes
router.get('/all', getAllVendors);
router.get('/all/active', getAllActiveVendors);
router.get('/download/:id', downloadBankDocument);

// 🔥 THIS MUST EXIST:
router.post('/upload/:id', upload.single("bankDocument"), replaceBankDocument);

// Also valid:
router.post('/', upload.single('BankDetailsDoc'), createVendor);

// ✅ Correct Export
module.exports = { vendorRouter: router };
