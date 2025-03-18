const { uploadInvoice, downloadInvoice, getAllInvoices, getMailSentStatus, toggleMailSentStatus} = require("../controllers/o&mInvoiceController");
const multer = require("multer");
const express = require("express");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("pdfFile"), uploadInvoice);
router.get("/download/:id", downloadInvoice);
router.get("/all",getAllInvoices);
router.get("/status",getMailSentStatus);
router.put('/status/:id',toggleMailSentStatus);
router.get('/all/hq',);

module.exports= { OAndMRouter:router };
