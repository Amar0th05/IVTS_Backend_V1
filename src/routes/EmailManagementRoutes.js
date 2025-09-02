// routes/emailRoutes.js
const express = require('express');
const EmailRouter = express.Router();
const { emailget,emailsave } = require('../controllers/EmailManagementController');

EmailRouter.get('/get-email-configs', emailget);
EmailRouter.post('/save-email-config', emailsave);

module.exports = {EmailRouter}; // ✅ Export the router directly
