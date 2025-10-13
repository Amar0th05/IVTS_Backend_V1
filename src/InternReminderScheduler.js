import sql from "mssql";
import cron from "node-cron";
import { sendInternReminderMail } from "./mailer"; // import your mailer
const {sql,getPool} = require('../config/dbconfig');
let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();
// 🔹 Function to check database and send reminder mails
async function checkAndSendReminders() {
  try {
    const pool = await getPool();

    // 1️⃣ Fetch interns whose EndDate is 10 days away & not yet mailed
    const result = await pool.request().query(`
      SELECT 
    i.ID,
    i.FullName,
    i.Email AS InternEmail,
    i.EndDate,
    i.Reporting_Manager,
    parts.EmpID,
    parts.StaffName,
    s.Official_Email_Address AS ManagerEmail
    s.Staff_Name AS ManagerName
FROM dbo.internApplicants i
OUTER APPLY (
    SELECT
        CASE 
            WHEN CHARINDEX('-', i.Reporting_Manager) > 0 
            THEN LTRIM(RTRIM(LEFT(i.Reporting_Manager, CHARINDEX('-', i.Reporting_Manager) - 1))) 
            ELSE NULL 
        END AS EmpID,
        CASE 
            WHEN CHARINDEX('-', i.Reporting_Manager) > 0 
            THEN LTRIM(RTRIM(SUBSTRING(i.Reporting_Manager, CHARINDEX('-', i.Reporting_Manager) + 1, LEN(i.Reporting_Manager)))) 
            ELSE LTRIM(RTRIM(i.Reporting_Manager)) 
        END AS StaffName
) AS parts
LEFT JOIN dbo.Staffs s
  ON (
       (parts.EmpID IS NOT NULL AND parts.EmpID = s.Employee_ID_if_already_assigned)
       OR
       (parts.EmpID IS NULL AND parts.StaffName = s.Staff_Name)
     )
WHERE 
    i.EndDate IS NOT NULL
    AND DATEDIFF(DAY, GETDATE(), i.EndDate) = 10
    AND (i.ReminderMailSent = 0 OR i.ReminderMailSent IS NULL);
    `);

    const interns = result.recordset;

    console.log(interns);

    // 2️⃣ Loop through each intern and send mail
    for (const intern of interns) {
      try {
        await sendInternReminderMail(intern);

        // 3️⃣ Mark mail as sent in DB
        await pool.request()
          .input("id", sql.Int, intern.ID)
          .query("UPDATE dbo.internApplicants SET ReminderMailSent = 1 WHERE ID = @id");

        console.log(`✅ Reminder mail sent for ${intern.FullName}`);
      } catch (err) {
        console.error(`❌ Failed to send mail for ${intern.FullName}:`, err.message);
      }
    }

    console.log("📅 Reminder check complete.");
  } catch (error) {
    console.error("❌ Error in reminder scheduler:", error.message);
  }
}

// 🔹 Scheduler (Runs daily at 9 AM)
export function startInternReminderScheduler() {
  cron.schedule("* * * * *", async () => {
    console.log("🔍 Running internship 10-day reminder check...");
    await checkAndSendReminders();
  });
}
