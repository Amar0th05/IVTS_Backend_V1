const {updateDeliverable,createDeliverable} = require("../controllers/ProjectDeliverablesController");
const express = require("express");
const DeliverablesRouter=express.Router();

DeliverablesRouter.put("/",updateDeliverable);
DeliverablesRouter.post("/",createDeliverable);

module.exports={
    DeliverablesRouter,
    createDeliverable,
}