const express = require('express');
const sql = require('mssql');
const multer = require('multer');

const { requestLeave,rejectLeaveForm,approveLeave,rejectLeave, getemployees, getManagerByEmployeeId , getSupportDocument} = require('../controllers/InternLeaveController');
const InternLeaveRouter = express.Router();

const storage=multer.memoryStorage();
const upload = multer({storage});

InternLeaveRouter.get("/document/:token", getSupportDocument);

InternLeaveRouter.get('/getemployees', getemployees);
// GET employee list (for dropdown)
// InternLeaveRouter.get('/getemployees/:email', getemployees);



// --- Step 1: Employee submits leave request (email goes to HR) ---
InternLeaveRouter.post("/request", upload.single("documentUpload"),requestLeave);



// --- Step 2: HR clicks Approve link (insert into DB as Approved) ---
InternLeaveRouter.get("/approve/:token", approveLeave);

// --- Step 3a: HR clicks Reject link (show rejection form) ---
InternLeaveRouter.get("/reject/:token", rejectLeaveForm);

// --- Step 3b: HR submits rejection form (insert into DB as Rejected) ---
InternLeaveRouter.post("/reject/:token", rejectLeave);


// GET manager by employee ID
InternLeaveRouter.get('/getemployees/:employeeId/manager', getManagerByEmployeeId);


module.exports = {InternLeaveRouter} ;
