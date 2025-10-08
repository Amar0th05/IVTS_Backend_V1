// LeaveManageRouter.js
const express = require('express');
const { getLeaveSummary } = require('../controllers/LeaveManageController');

const LeaveManageRouter = express.Router();

// Route to get leave summary
LeaveManageRouter.get('/', getLeaveSummary);

module.exports = {LeaveManageRouter};  // ✅ THIS MUST BE PRESENT
