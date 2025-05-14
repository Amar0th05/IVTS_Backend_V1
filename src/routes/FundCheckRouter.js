const fundCheckRouter=require('express').Router();
const {createRecord, getRecordById}=require('../controllers/FundCheckController');

fundCheckRouter.post('/:id',createRecord);
fundCheckRouter.get('/:id',getRecordById);

module.exports = {fundCheckRouter};