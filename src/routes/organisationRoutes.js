const { getActiveOrganisations, getAllOrganisations,toggleStatus, getOrganisationById, createOrganisation,
    updateOrganisation
}=require('../controllers/organisationController');
const express = require('express');
const router = express.Router();

router.get('/all/active',getActiveOrganisations);
router.get('/all',getAllOrganisations);
router.put('/togglestatus/:id',toggleStatus);
router.get('/:id',getOrganisationById);
router.post('/add',createOrganisation);
router.put('/:id', updateOrganisation);

module.exports = {organizationRouter:router};