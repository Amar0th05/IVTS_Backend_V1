const{getAllUsers,findUserById,toggleUserStatus, registerUser, updateUser}=require('../controllers/UserController');

const express = require('express');
const router = express.Router();

router.get('/all',getAllUsers);
router.get('/:id',findUserById);
router.post('/',registerUser);
router.put('/',updateUser);
router.put('status/:id',toggleUserStatus);

module.exports = {userRouter:router};