// src/controllers/LeaveManageController.js
const {getPool} = require('../config/dbconfig');
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
        [Leave_ID] AS leaveId,                 -- Added Leave_ID
        [Employee_ID] AS employeeId,
        [Employee_Name] AS employeeName,
        DATENAME(MONTH, [Leave_Start_Date]) AS month,  -- Convert date to month name
        [Leave_Type] AS leaveType,
        [Status] AS leaveStatus                 -- Use the readable Status column
      FROM [IVTS_MANAGEMENT].[dbo].[LeaveInfo]
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

module.exports={getLeaveSummary};