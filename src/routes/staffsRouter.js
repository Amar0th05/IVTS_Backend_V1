const {getAllStaffs,addStaffs,getStaff,updateStaffs,toggleIITStaffStatus,downloadAllIITStaff}=require('../controllers/staffsController');
const express=require('express');
const staffsRouter=express.Router();

staffsRouter.get('/',getAllStaffs);
staffsRouter.get('/download',downloadAllIITStaff);
staffsRouter.get('/:id',getStaff);
staffsRouter.post('/add',addStaffs);
staffsRouter.put('/',updateStaffs);
staffsRouter.put('/status/:id',toggleIITStaffStatus);



module.exports={staffsRouter};