const { getActiveCourses ,getAllCourses,getCourseById,toggleCourseStatus,createCourse, updateCourse}=require('../controllers/courseController');
const express = require('express');
const {authorizeRole} = require("../middlewares/rbacMiddleware");
const router = express.Router();



router.get('/active',getActiveCourses);
router.get('/all',authorizeRole([2]),getAllCourses);
router.get('/:id',authorizeRole([2]),getCourseById);
router.put('/status/:id',authorizeRole([2]),toggleCourseStatus);
router.post('/',authorizeRole([2]),createCourse);
router.put('/:id',authorizeRole([2]),updateCourse);

module.exports = {courseRouter:router};