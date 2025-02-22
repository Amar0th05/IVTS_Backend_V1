const { getActiveHighestQualifications,getAllHighestQualifications ,toggleStatus, getQualificationById,
    createQualification, updateQualification
}=require('../controllers/highestQualificationController');
const express = require('express');

const {authorizeRole} = require('../middlewares/rbacMiddleware');

const router = express.Router();



router.get('/all/active',getActiveHighestQualifications);
router.get('/all',authorizeRole([2]),getAllHighestQualifications);
router.put('/togglestatus/:id',authorizeRole([2]),toggleStatus);
router.get('/:id',authorizeRole([2]),getQualificationById);
router.post('/add',authorizeRole([2]),createQualification);
router.put('/:id',authorizeRole([2]),updateQualification);

module.exports = {highestQualificationRouter:router};