const {createRecord, getRecordById} = require("../controllers/ICSRSubmissionStageController");
const router=require('express').Router();

router.post("/:id",createRecord);
router.get('/:id',getRecordById);

module.exports = {ICSRRouter:router};
