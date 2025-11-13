// LeaveManageRouter.js
const express = require('express');
const { getLeaveSummary,getLeaveSummaryById} = require('../controllers/LeaveManageController');

const LeaveManageRouter = express.Router();

// Route to get leave summary
LeaveManageRouter.get('/', getLeaveSummary);
LeaveManageRouter.get('/:id',getLeaveSummaryById)

module.exports = {LeaveManageRouter};  // ✅ THIS MUST BE PRESENT
