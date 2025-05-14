const{getAllRoles,createRole,updateRole, getRoleById, getRolePermissionsForModules, getRolePermissionsForModulesById,
    updatePermission
}=require('../controllers/rolesController')

const{authorizeRole}=require('../middlewares/rbacMiddleware')

const express = require('express');
const router = express.Router();

router.get('/all',getAllRoles);
router.post('/',authorizeRole([2]),createRole);
router.put('/:id',authorizeRole([2]),updateRole);
router.get('/:id',authorizeRole([2]),getRoleById);
router.get('/role/perms',getRolePermissionsForModules);
router.get('/role/perms/:id',getRolePermissionsForModulesById);
router.put('/perms/:id',authorizeRole([2]),updatePermission);

module.exports = {userRolesRouter:router};