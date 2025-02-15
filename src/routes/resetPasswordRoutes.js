const {resetPassword,sendResetPasswordMail} = require('../controllers/resetPasswordcontroller');
const express = require('express');
const router = express.Router();

router.post('/resetpassword',resetPassword);
router.post('/resetpassword/email',sendResetPasswordMail);

module.exports = {resetPasswordRouter:router};