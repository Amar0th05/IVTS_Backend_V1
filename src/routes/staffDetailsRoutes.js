const {getAllStaffDetails, getUserById,addStaffDetails,toggleStaffStatus,getUserByIdWithoutJoin,updateStaffDetails}=require('../controllers/staffDetailsController');
const express = require('express');
const router = express.Router();

router.get('/all',getAllStaffDetails);
router.get('/:id',getUserByIdWithoutJoin);
router.post('/',addStaffDetails);
router.put('/status/:id',toggleStaffStatus);
router.put('/',updateStaffDetails);

module.exports = {staffDetailsRouter: router};