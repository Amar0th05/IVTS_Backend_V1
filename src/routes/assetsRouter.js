const {getAssets,getStaff,addLaptops,toggleLaptopStatus,getAllLaptops}=require('../controllers/assetsController');
const express=require('express');
const assetsRouter=express.Router();

// laptop
assetsRouter.get('/Laptops',getAllLaptops);
assetsRouter.post('/Laptops/add',addLaptops);
assetsRouter.put('/Laptops/status/:id',toggleLaptopStatus);

assetsRouter.get('/getstaff',getStaff);
assetsRouter.get('/:id',getAssets);




module.exports={assetsRouter};