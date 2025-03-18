const {getAllStaffDetails, getUserById,addStaffDetails,toggleStaffStatus,getUserByIdWithoutJoin,updateStaffDetails,downloadAllStaffDetails}=require('../controllers/staffDetailsController');
const express = require('express');
const router = express.Router();

router.get('/all',getAllStaffDetails);
router.get('/:id',getUserByIdWithoutJoin);
router.post('/',addStaffDetails);
router.put('/status/:id',toggleStaffStatus);
router.put('/',updateStaffDetails);
router.get('/download/all',downloadAllStaffDetails);

module.exports = {staffDetailsRouter: router};