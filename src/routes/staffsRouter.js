const {getAllStaffs,addStaffs}=require('../controllers/staffsController');
const express=require('express');
const staffsRouter=express.Router();

staffsRouter.get('/',getAllStaffs);
staffsRouter.post('/add',addStaffs);

module.exports={staffsRouter};