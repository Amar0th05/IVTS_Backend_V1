const{getAllRoles,createRole,updateRole, getRoleById}=require('../controllers/rolesController')

const{authorizeRole}=require('../middlewares/rbacMiddleware')

const express = require('express');
const router = express.Router();

router.get('/all',getAllRoles);
router.post('/',authorizeRole([2]),createRole);
router.put('/:id',authorizeRole([2]),updateRole);
router.get('/:id',authorizeRole([2]),getRoleById);

module.exports = {userRolesRouter:router};