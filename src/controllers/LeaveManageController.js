// src/controllers/LeaveManageController.js
// const {getPool} = require('../config/dbconfig');
const { sql, getPool } = require("../config/dbconfig");
let pool;
(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

// Get Leave Summary
async function getLeaveSummary(req, res) {
  try {
    const request = pool.request();

    const query = `
      SELECT 
        [Leave_ID] AS leaveId,
        [Employee_ID] AS employeeId,
        [Employee_Name] AS employeeName,
        [Total_Days]AS totalDays,
        DATENAME(MONTH, [Leave_Start_Date]) AS month,  
        [Leave_Type] AS leaveType,
        [Status] AS leaveStatus                 
      FROM dbo.LeaveInfo
      ORDER BY [Leave_Start_Date] DESC;
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ leave: result.recordset });
    } else {
      return res.status(404).json({ message: "No leave records found" });
    }
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}
async function getLeaveSummaryById(req, res) {
   const id = req.params.id;
  //  consolec
   console.log("dfhh", id);

  // if (!id || isNaN(id)) {
  //   return res.status(400).json({ message: "Invalid user id" });
  // }
  try {
    const request = pool.request();
    request.input("Employee_ID", sql.NVarChar(50), id);
    console.log('empd',id)
    const query = `
      SELECT 
      [Leave_Start_Date] AS leaveStartDate
      ,[Leave_End_Date] AS leaveEndDate
      ,[Total_Days]AS totalDays
      ,[LeaveReason] As Reason
      ,[SupportingDocument] AS Document
      ,[Rejection_Reason] As rejectionReason,
        [Employee_ID] AS employeeId,
        [Employee_Name] AS employeeName,
        DATENAME(MONTH, [Leave_Start_Date]) AS month,  
        [Leave_Type] AS leaveType,
        [Manager_Name] AS Manager,
        [Status] AS leaveStatus                 
      FROM dbo.LeaveInfo
      WHERE Employee_ID = @Employee_ID  
      ORDER BY [Leave_Start_Date] DESC;
    `;

    const result = await request.query(query);
    console.log('ksnk',result);

    // if (result.recordset.length > 0) {
      return res.json({leave: result.recordset });
    // } else {
    //   return res.status(404).json({ message: "No leave records found" });
    // }
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}

module.exports={getLeaveSummary,getLeaveSummaryById};