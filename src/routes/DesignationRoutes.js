const {getAllActiveDesignations,getDesignationById,toggleStatus,createDesignation,getAllDesignations, updateDesignation} = require("../controllers/DesignationController");
const {authorizeRole}=require('../middlewares/rbacMiddleware');
const express = require("express");

const router = express.Router();






router.get("/all",authorizeRole([2]),getAllDesignations);
router.get("/:id",authorizeRole([2]), getDesignationById);
router.put("/togglestatus/:id",authorizeRole([2]),toggleStatus);
router.post("/add",authorizeRole([2]),createDesignation);
router.get('/all/active',getAllActiveDesignations);
router.put('/:id',authorizeRole([2]),updateDesignation);

module.exports = {designationRouter:router};