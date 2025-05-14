const express = require('express');
const router = express.Router();
const{getAllActiveVendors,getAllVendors, createVendor}=require('../controllers/vendorsController');

router.get('/all',getAllVendors);
router.get('/all/active',getAllActiveVendors);
router.post('/',createVendor);
module.exports = {vendorRouter:router};