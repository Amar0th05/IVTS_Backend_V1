const {
    getEmployeeInsurance,
    checkActivePolicy,
    addEmployeeInsurance,
    updateEmployeeInsurance,
    toggleInsuranceStatus
} = require('../controllers/employeeInsuranceController');

const express = require('express');

const router = express.Router();

router.get('/employee/:id', getEmployeeInsurance);
router.get('/active/:id', checkActivePolicy);
router.post('/', addEmployeeInsurance);
router.put('/:id', updateEmployeeInsurance);
router.put('/status/:id', toggleInsuranceStatus);

module.exports = { employeeInsuranceRouter: router };
