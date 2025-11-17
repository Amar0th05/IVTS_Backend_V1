import { sql, getPool } from "../config/dbconfig.js";
// mailService.js
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

// Microsoft 365 / Outlook
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

let pool;

(async () => {
  try {
    pool = await getPool();
  } catch (err) {
    console.error("Error while getting pool in intern leave controller", err);
  }
})();

// Function to get the reporting manager for a given employee ID
export async function getManagerByEmployeeId(req, res) {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is required." });
  }

  try {
    const request = pool.request();
    request.input("employeeId", sql.NVarChar(50), employeeId);

    const query = `
            SELECT Reporting_Manager_Name AS managerName
            FROM dbo.Staffs
            WHERE Employee_ID_if_already_assigned = @employeeId;
        `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ manager: result.recordset[0].managerName });
    } else {
      return res
        .status(404)
        .json({ message: "No manager found for this employee ID." });
    }
  } catch (err) {
    console.error("Error fetching manager details:", err);
    res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}


export async function getemployees(req, res) {
  console.log("Fetching employee details");
  try {
    const result = await pool.request().query(`
            SELECT Employee_ID_if_already_assigned AS id,
                   Staff_Name AS name
            FROM dbo.Staffs
            ORDER BY Employee_ID_if_already_assigned ASC
        `);

    res.json({ employees: result.recordset });
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Server error" });
  }
}


// Function to get all employee IDs and names
// get managerName for leave 
// export async function getemployees(req, res) {
//   const { email } = req.params;
//   console.log("Fetching employee details for:", email);

//   try {
//     const request = pool.request();

//     // ✅ Correct variable name: 'email' (not 'emai')
//     request.input('email', sql.NVarChar, email);

//     const result = await request.query(`
//       SELECT 
//         Employee_ID_if_already_assigned AS id,
//         Staff_Name AS FullName,
//         Reporting_Manager_Name AS ManagerName
//       FROM dbo.Staffs
//       WHERE Personal_Email_Address = @email 
//          OR Official_Email_Address = @email
//     `);

//     res.json({ employees: result.recordset[0] });
//   } catch (err) {
//     console.error("Error fetching staff:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }


// --- 1. Employee submits leave request ---
export async function requestLeave(req, res) {
  const leaveData = req.body;
  const file=req.file;

  // Basic validation
  if (
    !leaveData?.employeeId ||
    !leaveData?.employeeName ||
    !leaveData?.startDate ||
    !leaveData?.endDate
  ) {
    return res.status(400).json({ message: "Incomplete leave data." });
  }

  const token = uuidv4(); // unique approval token

  try {
    // Step 1: Get manager info
    const mgrRequest = pool.request();
    mgrRequest.input(
      "employeeId",
      sql.NVarChar(50),
      leaveData.employeeId.trim()
    );

    const managerQuery = `
            SELECT s1.Reporting_Manager_Name AS managerName,
                   s2.Official_Email_Address AS managerEmail
            FROM dbo.Staffs s1
            LEFT JOIN dbo.Staffs s2
              ON s1.Reporting_Manager_Name = s2.Staff_Name
            WHERE s1.Employee_ID_if_already_assigned = @employeeId
        `;

    const mgrResult = await mgrRequest.query(managerQuery);

    // Ensure manager info exists
    let managerName = "Manager"; // fallback
    let managerEmail;

    if (mgrResult.recordset.length > 0) {
      managerName = mgrResult.recordset[0].managerName || "Manager";
      managerEmail = mgrResult.recordset[0].managerEmail;
    }

    if (!managerEmail) {
      return res.status(404).json({ message: "Manager email not found." });
    }

    // Step 2: Insert leave request into LeaveInfo
    const request = pool.request();
    request.input("employeeId", sql.NVarChar(50), leaveData.employeeId.trim());
    request.input(
      "employeeName",
      sql.NVarChar(100),
      leaveData.employeeName.trim()
    );
    request.input("managerName", sql.NVarChar(100), managerName.trim());
    request.input("leaveType", sql.NVarChar(100), leaveData.leaveType || "");
    request.input("startDate", sql.Date, leaveData.startDate);
    request.input("endDate", sql.Date, leaveData.endDate);
    request.input("totalDays", sql.Float, leaveData.totalDays || 0);
    request.input("halfDay", sql.NVarChar(50), leaveData.halfDayOption || null);
    request.input(
      "leaveReason",
      sql.NVarChar(sql.MAX),
      leaveData.leaveReason || null
    );
    request.input(
      "supportingDocument",
      sql.VarBinary(sql.MAX),
      file ? file.buffer : null
    );
    request.input("status", sql.NVarChar(50), "Pending");
    request.input("token", sql.NVarChar(100), token);
    request.input("leaveStatus", sql.Int, 1); // 1 = Pending

    await request.query(`
            INSERT INTO LeaveInfo 
            (Employee_ID, Employee_Name, Manager_Name, Leave_Type, Leave_Start_Date, Leave_End_Date, Total_Days, Half_Day, LeaveReason, SupportingDocument, Status, Leave_Status, ApprovalToken)
            VALUES (@employeeId, @employeeName, @managerName, @leaveType, @startDate, @endDate, @totalDays, @halfDay, @leaveReason, @supportingDocument, @status, @leaveStatus, @token)
        `);

    // Step 3: Send email to manager
    leaveData.managerName = managerName; // ensure property name matches sendHRMail
    const employeeId = leaveData.employeeId; // ensure employee email is passed
    await sendHRMail(managerEmail, employeeId, leaveData, token);
    console.log("✅ Leave email sent to manager successfully!");

    res.status(200).json({ message: "Leave request submitted successfully." });
  } catch (err) {
    console.error("Error submitting leave:", err);
    return res.status(500).json({ message: "Server error." });
  }
}

// --- 2. Approve Leave ---
export async function approveLeave(req, res) {
  const { token } = req.params;

  try {
    const request = pool.request();
    request.input("token", sql.NVarChar(100), token);

    // Step 1: Find the leave entry
    const result = await request.query(`
      SELECT * FROM LeaveInfo WHERE ApprovalToken = @token
    `);

    if (result.recordset.length === 0) {
      return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Already Processed</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
 
        .card {
            background-color: #fff;
            border-radius: 16px;
            padding: 50px 60px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            animation: fadeIn 0.6s ease;
        }
 
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
 
        .icon {
            width: 80px;
            height: 80px;
            background-color: #fee2e2;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
        }
 
        svg {
            width: 44px;
            height: 44px;
            stroke: #dc2626;
            stroke-width: 2.5;
            fill: none;
        }
 
        h2 {
            color: #b91c1c;
            margin-bottom: 10px;
            font-size: 24px;
        }
 
        p {
            color: #4b5563;
            margin-bottom: 25px;
            font-size: 16px;
        }
 
        a.button {
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            transition: 0.3s;
        }
 
        a.button:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>
 
<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        </div>
        <h2>Already Processed</h2>
        <p>The approval link you’re trying to access is invalid, expired, or has already been used.</p>
        <p>Please check your email for a valid approval link or contact the administrator for assistance.</p>
        <a href="/" class="button">← Go to Dashboard</a>
    </div>
</body>
</html>
`);
    }

    const leave = result.recordset[0];

    // ✅ Check if leave is still pending
    if (leave.Leave_Status !== 1) {
      // 1 = Pending
      return res
        .status(400)
        .send("This leave request has already been processed.");
    }

    // Step 2: Fetch employee's official email from Staffs table
    const empRequest = pool.request();
    empRequest.input("employeeId", sql.NVarChar(50), leave.Employee_ID);

    const empEmailQuery = `
      SELECT 
        COALESCE(Official_Email_Address, Personal_Email_Address) AS employeeEmail
    FROM dbo.Staffs
    WHERE Employee_ID_if_already_assigned = @employeeId
    `;

    const empResult = await empRequest.query(empEmailQuery);

    if (
      empResult.recordset.length === 0 ||
      !empResult.recordset[0].employeeEmail
    ) {
      console.warn("⚠️ Employee email not found in Staffs table.");
    }

    const employeeEmail = empResult.recordset[0]?.employeeEmail;

    // Step 3: Update leave status to Approved
    await request.query(`
  UPDATE LeaveInfo 
  SET Status = 'Approved', Leave_Status = 2 ,ApprovalToken = NULL
  WHERE ApprovalToken = @token
`);

    // Step 4: Send notification to employee (if email found)
    if (employeeEmail) {
      await sendEmployeeNotificationMail(
        employeeEmail,
        {
          employeeName: leave.Employee_Name,
          managerName: leave.Manager_Name,
          startDate: leave.Leave_Start_Date,
          endDate: leave.Leave_End_Date,
          leaveType: leave.Leave_Type,
          totalDays: leave.Total_Days,
          leaveReason: leave.LeaveReason,
        },
        "Approved"
      );
    }

    res.send(`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Leave Approved</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }

        .card {
            background-color: #fff;
            border-radius: 16px;
            padding: 50px 60px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            animation: fadeIn 0.6s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .icon {
            width: 80px;
            height: 80px;
            background-color: #dcfce7;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
        }

        svg {
            width: 40px;
            height: 40px;
            stroke: #16a34a;
            stroke-width: 2.5;
            fill: none;
        }

        h2 {
            color: #166534;
            margin-bottom: 10px;
            font-size: 24px;
        }

        p {
            color: #4b5563;
            margin-bottom: 25px;
            font-size: 16px;
        }

        a.button {
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            transition: 0.3s;
        }

        a.button:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M9 16l2 2l4-4"></path>
            </svg>
        </div>
        <h2>Leave Approved Successfully!</h2>
        <p>You have successfully approved the employee’s leave request.</p>
        <p>The employee will be notified accordingly.</p>
        <a href="/" class="button">+ Go to Worksphere</a>
    </div>
</body>

</html>
`);
  } catch (err) {
    console.error("Error approving leave:", err);
    res.status(500).send("Server error.");
  }
}

// --- 3a. Show reject form ---
export async function rejectLeave(req, res) {
  const { token } = req.params;
  const { reason, Rejectreason } = req.body;
  const finalReason = reason || Rejectreason || "";

  try {
    const request = pool.request();
    request.input("token", sql.NVarChar(100), token);
    request.input(
      "reason",
      sql.NVarChar(sql.MAX),
      finalReason && finalReason.trim() !== "" ? finalReason.trim() : ""
    );

    const result = await request.query(`
      SELECT * FROM LeaveInfo WHERE ApprovalToken = @token
    `);

    if (result.recordset.length === 0) {
      return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Already Processed</title>
    <style>
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
 
        .card {
            background-color: #fff;
            border-radius: 16px;
            padding: 50px 60px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            animation: fadeIn 0.6s ease;
        }
 
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
 
        .icon {
            width: 80px;
            height: 80px;
            background-color: #fee2e2;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
        }
 
        svg {
            width: 44px;
            height: 44px;
            stroke: #dc2626;
            stroke-width: 2.5;
            fill: none;
        }
 
        h2 {
            color: #b91c1c;
            margin-bottom: 10px;
            font-size: 24px;
        }
 
        p {
            color: #4b5563;
            margin-bottom: 25px;
            font-size: 16px;
        }
 
        a.button {
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            transition: 0.3s;
        }
 
        a.button:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>
 
<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        </div>
        <h2> Action Already Processed</h2>
        <p>The approval link you’re trying to access is invalid, expired, or has already been used.</p>
        <a href="/" class="button">← Go to Worksphere</a>
    </div>
</body>
</html>
`);
    }

    const leave = result.recordset[0];

    const empRequest = pool.request();
    empRequest.input("employeeId", sql.NVarChar(50), leave.Employee_ID);
    const empResult = await empRequest.query(`
    SELECT 
        COALESCE(Official_Email_Address, Personal_Email_Address) AS employeeEmail
    FROM dbo.Staffs
    WHERE Employee_ID_if_already_assigned = @employeeId
`);
    const employeeEmail = empResult.recordset[0]?.employeeEmail;

    await request.query(`
            UPDATE LeaveInfo
            SET Status = 'Rejected', Leave_Status = 3, Rejection_Reason = @reason, ApprovalToken = NULL
            WHERE ApprovalToken = @token
        `);

    if (employeeEmail) {
      await sendEmployeeNotificationMail(
        employeeEmail,
        {
          employeeName: leave.Employee_Name,
          managerName: leave.Manager_Name,
          startDate: leave.Leave_Start_Date,
          endDate: leave.Leave_End_Date,
          leaveType: leave.Leave_Type,
          totalDays: leave.Total_Days,

          leaveReason: leave.LeaveReason,
          rejectionReason:
            finalReason && finalReason.trim() !== ""
              ? finalReason.trim()
              : "No reason provided",
        },
        "Rejected"
      );
    }

    // Send rejection page with a clear red X
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Leave Rejected</title>
<style>
body {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
}
.card {
    background-color: #fff;
    border-radius: 16px;
    padding: 50px 60px;
    text-align: center;
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    max-width: 600px;
    animation: fadeIn 0.6s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
.icon {
    width: 80px;
    height: 80px;
    background-color: #fee2e2;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 25px;
}
svg {
    width: 42px;
    height: 42px;
    stroke: #dc2626;
    stroke-width: 3;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
}
h2 {
    color: #991b1b;
    margin-bottom: 10px;
    font-size: 24px;
}
p {
    color: #4b5563;
    margin-bottom: 25px;
    font-size: 16px;
}
a.button {
    background-color: #2563eb;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    transition: 0.3s;
}
a.button:hover { background-color: #1d4ed8; }
</style>
</head>
<body>
<div class="card">
    <div class="icon">
        <svg viewBox="0 0 24 24">
            <!-- Calendar outline -->
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <!-- Centered red X -->
            <!-- Smaller centered red X -->
<line x1="10" y1="15" x2="14" y2="19" class="x-mark"></line>
<line x1="14" y1="15" x2="10" y2="19" class="x-mark"></line>

        </svg>
    </div>
    <h2>Leave Request Rejected</h2>
    <p>You have successfully rejected the employee’s leave request.</p>
    <p>The employee will be notified accordingly.</p>
    <a href="/" class="button">+ Go to Worksphere</a>
</div>
</body>
</html>
        `);
  } catch (err) {
    console.error("Error rejecting leave:", err);
    res.status(500).send("Server error.");
  }
}

// --- 3b. Show reject form ---
export async function rejectLeaveForm(req, res) {
  const { token } = req.params;
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reject Leave Application</title>
  <style>
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }

    .card {
      background-color: #fff;
      border-radius: 16px;
      padding: 50px 60px;
      text-align: center;
      box-shadow: 0 15px 30px rgba(0,0,0,0.1);
      max-width: 600px;
      width: 100%;
      margin: 20px;
      animation: fadeIn 0.6s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .icon {
      width: 80px;
      height: 80px;
      background-color: #fee2e2;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 25px;
    }

    svg {
      width: 42px;
      height: 42px;
      stroke: #dc2626;
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    h2 {
      color: #991b1b;
      margin-bottom: 10px;
      font-size: 24px;
    }

    p {
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 25px;
    }

    label {
      display: block;
      text-align: left;
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
      font-size: 15px;
    }

    textarea {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      resize: vertical;
      font-family: inherit;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    textarea:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
    }

    button {
      background-color: #dc2626;
      color: #fff;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      margin-top: 20px;
      transition: 0.3s;
    }

    button:hover {
      background-color: #b91c1c;
    }

    .cancel {
      background-color: #d1d5db;
      color: #111827;
      margin-left: 10px;
    }

    .cancel:hover {
      background-color: #9ca3af;
    }

    /* Calendar X styling */
    .x-mark {
      stroke: #dc2626;
      stroke-width: 3;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24">
        <!-- Calendar outline -->
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <!-- Smaller centered red X -->
<line x1="10" y1="15" x2="14" y2="19" class="x-mark"></line>
<line x1="14" y1="15" x2="10" y2="19" class="x-mark"></line>

      </svg>
    </div>
    <h2>Reject Leave Application</h2>
    <p>Please provide a reason for rejecting this leave request. This reason will be shared with the employee.</p>
    <form method="POST" action="/internLeaveRequest/reject/${token}">
      <label for="Rejectreason">Rejection Reason</label>
      <textarea id="Rejectreason" name="Rejectreason" rows="4" required placeholder="Enter Reason for Rejection"></textarea>
      <br/>
      <button type="submit">Submit Rejection</button>
      <button type="button" class="cancel" onclick="window.history.back()">Cancel</button>
    </form>
  </div>
</body>
</html>
  `);
}

// Function to send email to manager with Approve/Reject links
async function sendHRMail(to, employeeId, leave, token) {
    const baseUrl = process.env.BASE_URL || "https://ntcpwcit.in/worksphere/api";
  // const baseUrl = process.env.BASE_URL || "http://localhost:5500";
  const approveUrl = `${baseUrl}/internLeaveRequest/approve/${token}`;
  const rejectUrl = `${baseUrl}/internLeaveRequest/reject/${token}`;

  const formattedStart = new Date(leave.startDate).toLocaleDateString();
  const formattedEnd = new Date(leave.endDate).toLocaleDateString();
  const submittedOn = new Date().toLocaleDateString();

  // --- 🔹 1️⃣ Fetch employee email from DB
  const empEmailQuery = `
    SELECT 
      COALESCE(Official_Email_Address, Personal_Email_Address) AS employeeEmail
    FROM dbo.Staffs
    WHERE Employee_ID_if_already_assigned = @employeeId
  `;

  let employeeEmail = null;
  try {
    const empRequest = new sql.Request(pool);
    const empResult = await empRequest
      .input("employeeId", employeeId)
      .query(empEmailQuery);

    if (
      empResult.recordset.length === 0 ||
      !empResult.recordset[0].employeeEmail
    ) {
      console.warn(`⚠️ Employee email not found for ID: ${employeeId}`);
    } else {
      employeeEmail = empResult.recordset[0].employeeEmail;
    }
  } catch (err) {
    console.error("❌ Error fetching employee email:", err);
  }

  // --- 2️⃣ Mail to Manager
  const managerMail = {
    from: process.env.EMAIL_SENDER,
    to, // Manager's email
    subject: `Leave Application Request – ${leave.employeeName} (${formattedStart} to ${formattedEnd})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #333;">
        <p><b>Dear ${leave.managerName},</b></p>
        <p><b>${leave.employeeName}</b> (Employee ID: <b>${
      leave.employeeId
    }</b>) has applied for leave.</p>

        <ul>
          <li><b>Leave Type:</b> ${leave.leaveType}</li>
<li>
  <b>Period:</b> ${formattedStart} to ${formattedEnd}
  (${
    leave.totalDays === "0.5"
      ? leave.halfDayOption
      : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`
  })
</li>
          <li><b>Reason:</b> ${leave.leaveReason || "N/A"}</li>
          <li><b>Submitted On:</b> ${submittedOn}</li>
        </ul>

        <p>Please take action below:</p>
        <a href="${approveUrl}" style="background:#28a745;color:#fff;padding:10px 15px;border-radius:5px;text-decoration:none;">✅ Approve</a>
        <a href="${rejectUrl}" style="background:#dc3545;color:#fff;padding:10px 15px;border-radius:5px;text-decoration:none;margin-left:10px;">❌ Reject</a>

        <p style="margin-top:20px;">Regards,<br><b>NTCPWC WorkSphere</b></p>
        <hr style="border:none;border-top:1px solid #ddd;">
        <small style="color:#777;">This is an automated message. Please do not reply.</small>
      </div>
    `,
  };

  // --- 3️⃣ Mail to HR
  const hrMail = {
    from: process.env.EMAIL_SENDER,
    to: process.env.HR_CC_EMAIL,
    subject: `HR Copy – Leave Request of ${leave.employeeName} (${formattedStart} to ${formattedEnd})`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #333;">
        <p><b>Dear HR Team,</b></p>
        <p>A leave request has been submitted by <b>${
          leave.employeeName
        }</b> (Employee ID: ${leave.employeeId}).</p>
        <ul>
          <li><b>Leave Type:</b> ${leave.leaveType}</li>
          <li>
  <b>Period:</b> ${formattedStart} to ${formattedEnd}
  (${
    leave.totalDays === "0.5"
      ? leave.halfDayOption
      : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`
  })
</li>
          <li><b>Reason:</b> ${leave.leaveReason || "N/A"}</li>
          <li><b>Submitted On:</b> ${submittedOn}</li>
          <li><b>Reporting Manager:</b> ${leave.managerName}</li>
        </ul>
        <p>This is a copy for HR records only. No action is required.</p>

        <p style="margin-top:20px;">Regards,<br><b>NTCPWC WorkSphere</b></p>
        <hr style="border:none;border-top:1px solid #ddd;">
        <small style="color:#777;">This is an automated message. Please do not reply.</small>
      </div>
    `,
  };

  // --- 4️⃣ Mail to Employee (only if found)
  const employeeMail = employeeEmail
    ? {
        from: process.env.EMAIL_SENDER,
        to: employeeEmail,
        subject: `Leave Request Submitted – ${formattedStart} to ${formattedEnd}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #333;">
            <p><b>Dear ${leave.employeeName},</b></p>
            <p>Your leave application has been successfully submitted and sent to your manager (<b>${
              leave.managerName
            }</b>) for approval.</p>

            <ul>
              <li><b>Leave Type:</b> ${leave.leaveType}</li>
              <li>
  <b>Period:</b> ${formattedStart} to ${formattedEnd}
  (${
    leave.totalDays === "0.5"
      ? leave.halfDayOption
      : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`
  })
</li>
              <li><b>Reason:</b> ${leave.leaveReason || "N/A"}</li>
              <li><b>Submitted On:</b> ${submittedOn}</li>
            </ul>

            <p>You will receive an update once your manager takes action.</p>

            <p style="margin-top:20px;">Regards,<br><b>NTCPWC WorkSphere</b></p>
            <hr style="border:none;border-top:1px solid #ddd;">
            <small style="color:#777;">This is an automated message. Please do not reply.</small>
          </div>
        `,
      }
    : null;

  try {
    const tasks = [
      transporter.sendMail(managerMail),
      transporter.sendMail(hrMail),
    ];
    if (employeeMail) tasks.push(transporter.sendMail(employeeMail));

    const results = await Promise.all(tasks);

    console.log(`✅ Manager mail sent: ${results[0].response}`);
    console.log(`✅ HR mail sent: ${results[1].response}`);
    if (employeeMail)
      console.log(`✅ Employee mail sent: ${results[2].response}`);

    return true;
  } catch (err) {
    console.error("❌ Error sending leave request emails:", err);
    return false;
  }
}

// Function to send email notification to the employee after manager's approval/rejection
async function sendEmployeeNotificationMail(to, leave, status) {
  const formattedStart = new Date(leave.startDate).toLocaleDateString();
  const formattedEnd = new Date(leave.endDate).toLocaleDateString();

  const isApproved = status.toLowerCase() === "approved";
  const isRejected = status.toLowerCase() === "rejected";

  const managerRemarks =
    isRejected && leave.rejectionReason
      ? leave.rejectionReason
      : isApproved
      ? ""
      : "N/A";

  // ---------------------------------
  // Leave type labels
  // ---------------------------------
  const leaveTypeLabels = {
    CL: "Casual Leave (CL)",
    SL: "Sick Leave (SL)",
    EL: "Earned Leave (EL)",
    "Comp-off": "Compensatory Off (Comp-off)",
    Other: "Other",
  };

  // ---------------------------------
  // Approved and Rejected messages
  // ---------------------------------
  const leaveMessages = {
    CL: {
      approved:
        "Please make sure any pending work is handled or updated before your leave. Hope you enjoy your time away.",
      rejected:
        "Your casual leave request could not be approved at this time. You may discuss alternate dates with your manager if required.",
    },
    SL: {
      approved:
        "Take the rest you need and focus on getting better. Wishing you a quick recovery — HR has been notified.",
      rejected:
        "Your sick leave request has not been approved. Please reach out to your manager if you wish to discuss this further.",
    },
    EL: {
      approved:
        "Ensure your ongoing tasks are wrapped up or handed over before you leave. Enjoy your well-earned break.",
      rejected:
        "Your earned leave request has been declined. You can check with your manager if rescheduling is possible.",
    },
    "Comp-off": {
      approved:
        "Enjoy your compensatory day off — a well-deserved break for your extra effort.",
      rejected:
        "Your compensatory off request was not approved. Please verify eligibility or discuss with your manager.",
    },
    Other: {
      approved:
        "We understand your situation and appreciate you informing us. Please take the time you need — HR has been notified for records.",
      rejected:
        "Your leave request could not be approved at this time. Please get in touch with your manager if further discussion is needed.",
    },
  };

  const leaveLabel = leaveTypeLabels[leave.leaveType] || "Leave";
  const formattedStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const subjectLine = `Your ${leaveLabel} Has Been ${formattedStatus}`;

  // ---------------------------------
  // HTML Email Template
  // ---------------------------------
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; color:#333; font-size:15px; line-height:1.6;">
      <p>Hi <b>${leave.employeeName}</b>,</p>

      <p>
        Your <b>${leaveLabel}</b> request from <b>${formattedStart}</b> to <b>${formattedEnd}</b>
        (<b>${
    leave.totalDays === "0.5"
      ? leave.halfDayOption
      : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`
  }</b>) has been 
        <span style="font-weight:bold;">${formattedStatus}</span>
        by <b>${leave.managerName}</b>.
      </p>

      ${
        isRejected
          ? `<p style="background:#fdecea; padding:10px 15px; border-radius:6px;">
              <b>Remarks from Manager:</b><br/>
              ${managerRemarks}
            </p>`
          : ""
      }

      <p>${
        (console.log("kuyuu", leave.leaveType),
        leaveMessages[leave.leaveType]
          ? leaveMessages[leave.leaveType][isApproved ? "approved" : "rejected"]
          : leaveMessages["Other"][isApproved ? "approved" : "rejected"])
      }</p>
    

      <p>Best regards,<br/><b>NTCPWC WorkSphere</b></p>

      <hr style="border:none; border-top:1px solid #ddd; margin:25px 0;">
      <p style="font-size:12px; color:#777;">This is an automated email. Please do not reply directly.</p>
    </div>
  `;

  // ---------------------------------
  // Mail sending
  // ---------------------------------
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to,
    cc: process.env.HR_CC_EMAIL, // optional: HR copy
    subject: subjectLine,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ ${status} email sent to ${to}`, info.response);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send ${status} email to ${to}:`, err);
    return false;
  }
}
