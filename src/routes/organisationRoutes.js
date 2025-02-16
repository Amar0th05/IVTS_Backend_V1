const { getActiveOrganisations }=require('../controllers/organisationController');
const express = require('express');
const router = express.Router();

router.get('/',getActiveOrganisations);

module.exports = {organizationRouter:router};