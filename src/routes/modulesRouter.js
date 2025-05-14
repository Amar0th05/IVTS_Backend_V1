const {getAllModules} = require("../controllers/modulesController");
const router = require('express').Router();

router.get('/all',getAllModules);

module.exports = {moduleRouter:router};