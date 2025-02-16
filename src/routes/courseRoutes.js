const { getActiveCourses }=require('../controllers/courseController');
const express = require('express');
const router = express.Router();

router.get('/',getActiveCourses);

module.exports = {courseRouter:router};