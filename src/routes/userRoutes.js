const{getAllUsers,findUserById,toggleUserStatus, registerUser, updateUser}=require('../controllers/UserController');

const{authorizeRole}=require('../middlewares/rbacMiddleware')

const express = require('express');
const router = express.Router();


router.use(authorizeRole([2]));

router.get('/all',getAllUsers);
router.get('/:id',findUserById);
router.post('/',registerUser);
router.put('/',updateUser);
router.put('/status/:id',toggleUserStatus);

module.exports = {userRouter:router};