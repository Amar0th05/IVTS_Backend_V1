const equipmentInvoiceRouter=require('express').Router();

const {groupInvoicesByProjectNumber,getInvoicesByProjectNumber,addInvoice,updateInvoice}=require('../controllers/equipmentInvoiceController');

equipmentInvoiceRouter.get('/group',groupInvoicesByProjectNumber);
equipmentInvoiceRouter.get('/project/:id',getInvoicesByProjectNumber);
equipmentInvoiceRouter.post('/', addInvoice);
equipmentInvoiceRouter.put('/', updateInvoice);

module.exports=
{
    equipmentInvoiceRouter,

}