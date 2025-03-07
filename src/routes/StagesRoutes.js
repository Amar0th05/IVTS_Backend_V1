const {getActiveStages, getAllStages, getStageById, toggleStageStatus, createStage, updateStage,} = require('../controllers/StagesController');

const express = require('express');
const { authorizeRole } = require('../middlewares/rbacMiddleware');
const router = express.Router();


router.get('/active', getActiveStages);
router.get('/all', authorizeRole([2]), getAllStages);
router.get('/:id', authorizeRole([2]), getStageById);
router.put('/status/:id', authorizeRole([2]), toggleStageStatus);
router.post('/', authorizeRole([2]), createStage);
router.put('/:id', authorizeRole([2]), updateStage);

module.exports = { stageRouter: router };