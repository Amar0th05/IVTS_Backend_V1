const {getAllStaffs}=require('../controllers/staffsController');
const express=require('express');
const staffsRouter=express.Router();

staffsRouter.get('/',getAllStaffs);

module.exports={staffsRouter};