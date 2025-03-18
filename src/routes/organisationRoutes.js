const { getActiveOrganisations, getAllOrganisations,toggleStatus, getOrganisationById, createOrganisation,
    updateOrganisation, getAllOrganisationsExceptHQ
}=require('../controllers/organisationController');
const express = require('express');
const {getAllInvoices} = require("../controllers/o&mInvoiceController");
const router = express.Router();

router.get('/all/active',getActiveOrganisations);
router.get('/all',getAllOrganisations);
router.put('/togglestatus/:id',toggleStatus);
router.get('/:id',getOrganisationById);
router.post('/add',createOrganisation);
router.put('/:id', updateOrganisation);
router.get('/all/hq',getAllOrganisationsExceptHQ);

module.exports = {organizationRouter:router};