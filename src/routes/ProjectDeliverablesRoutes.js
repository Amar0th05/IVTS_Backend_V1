const {updateDeliverable,createDeliverable,updatePayment,createPayment} = require("../controllers/ProjectDeliverablesController");
const express = require("express");
const DeliverablesRouter=express.Router();

DeliverablesRouter.put("/",updateDeliverable);
DeliverablesRouter.post("/",createDeliverable);
DeliverablesRouter.put('/payments',updatePayment);
DeliverablesRouter.post("/payments",createPayment);

module.exports={
    DeliverablesRouter,
}