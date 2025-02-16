const { getActiveHigestQualifications }=require('../controllers/highestQualificationController');
const express = require('express');
const router = express.Router();

router.get('/',getActiveHigestQualifications);

module.exports = {highestQualificationRouter:router};