const DesignationController = require("../controllers/DesignationController");

const express = require("express");

const router = express.Router();

router.get("/all", DesignationController.getAllDesignations);
router.get("/:id", DesignationController.getDesignationById);
router.put("/togglestatus/:id", DesignationController.toggleStatus);
router.post("/add", DesignationController.createDesignation);
router.get('/all/active',DesignationController.getAllActiveDesignations);

module.exports = router;