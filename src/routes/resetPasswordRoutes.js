const {resetPassword,sendResetPasswordMail,changePassword} = require('../controllers/resetPasswordcontroller');
const express = require('express');
const router = express.Router();
router.put('/changepassword',changePassword)
router.post('/resetpassword',resetPassword);
router.post('/resetpassword/email',sendResetPasswordMail);

module.exports = {resetPasswordRouter:router};