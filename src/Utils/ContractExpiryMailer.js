require('dotenv').config();
const { get } = require('express/lib/response');
const { sql, getPool } = require('../config/dbconfig');
const nodecron = require('node-cron');
const mailer = require("nodemailer");

let pool;


(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error initializing database pool:", err);
    }
})();

async function getLogsExpiringInThirtyDays() {
    try {
        if (!pool) {
            console.error("Database pool not initialized.");
            return null;
        }

        const request = await pool.request();
        const query = `

            WITH LatestContract AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY contract_end_date DESC) AS rn
                FROM tbl_contract_logs
            )
            SELECT
                s.staff_name AS name,
                d.designation AS designation,
                o.organisation_name AS port,
                DATEDIFF(DAY, GETDATE(), lc.contract_end_date) AS daysRemaining,
                lc.contract_end_date,
                CAST(GETDATE() AS DATE) AS [currentDate]
            FROM LatestContract lc
                     LEFT JOIN tbl_staff s ON s.staff_id = lc.emp_id
                     LEFT JOIN mmt_designation d ON d.des_id = lc.current_designation
                     LEFT JOIN mmt_organisation o ON o.org_id = s.location_of_work
            WHERE lc.rn = 1
              AND DATEDIFF(DAY, GETDATE(), lc.contract_end_date) = 30;

        `;

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return result.recordset;
        } else {
            console.log('No contracts expiring in 30 days.');
        }
        return null;
    } catch (err) {
        console.error("Error fetching contract logs:", err);
        return null;
    }
}


async function getLogsExpiringInFifteenDays() {
    try {
        if (!pool) {
            console.error("Database pool not initialized.");
            return null;
        }

        const request = await pool.request();
        const query = `

            WITH LatestContract AS (
                SELECT *,
                       ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY contract_end_date DESC) AS rn
                FROM tbl_contract_logs
            )
            SELECT
                s.staff_name AS name,
                d.designation AS designation,
                o.organisation_name AS port,
                DATEDIFF(DAY, GETDATE(), lc.contract_end_date) AS daysRemaining,
                lc.contract_end_date,
                CAST(GETDATE() AS DATE) AS [currentDate]
            FROM LatestContract lc
                     LEFT JOIN tbl_staff s ON s.staff_id = lc.emp_id
                     LEFT JOIN mmt_designation d ON d.des_id = lc.current_designation
                     LEFT JOIN mmt_organisation o ON o.org_id = s.location_of_work
            WHERE lc.rn = 1
              AND DATEDIFF(DAY, GETDATE(), lc.contract_end_date) = 15;

        `;

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return result.recordset;
        } else {
            console.log('No contracts expiring in 15 days.');
        }
        return null;
    } catch (err) {
        console.    error("Error fetching contract logs:", err);
        return null;
    }
}


const transporter=mailer.createTransport({
   service: 'gmail',
   auth:{
       user:process.env.EMAIL_SENDER,
       pass:process.env.EMAIL_PASSWORD
   }
});


async function getMails(){
    try{
        const request = await pool.request();
        const query = `SELECT COUNT(*) as count
                       FROM tbl_role_module_perms
                       WHERE RoleID = 11 AND ModuleID = 7 AND CanRead = 1;`
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return result.recordset;
        }
        return null;
    }catch(err){
        console.log(err);
        return null;
    }
}


async function sendAlert(email,days,name,port,designation,endDate){
    const mailOptions={
        from:process.env.EMAIL_SENDER,
        to:email,
        subject:`Contractual Employment Expiry in ${days} Days – Renewal Reminder`,
        html:
            `
        <b>Dear Admin Team,</b><br><br>
        
        This is an automated notification to inform you that the contractual employment of <b>${name}</b>, serving as <b>${designation}</b> at <b>${port}</b>, is set to end in <b>${days} days</b> on <b>${endDate}</b>.<br>
        If the contract renewal process has not yet been initiated, please take the necessary steps to avoid any service disruptions.<br>
        This is a system-generated message. For further assistance, please contact the relevant department.<br><br></br></br>
        
        <b>
        Regards,<br>
        IVTMS Management Portal
        </b>
            `
    };

    try{
        await transporter.sendMail(mailOptions);
        console.log('contract expiry reminder mail sent to : ',mailOptions.to);
        return true;
    }catch(err){
        console.log(err);
        return false;
    }

}


const hr_email = process.env.HR_EMAIL;
const to = process.env.To;


async function sendInternReminderMail(intern) {
    const date = new Date(intern.EndDate); // convert string/Date to JS Date
const formattedDate = `${("0" + date.getDate()).slice(-2)}-${("0" + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}`;
  const mailOptions = {
    from: `"IITM WorkSphere Portal" <${process.env.EMAIL_SENDER}>`,
    // to: intern.ManagerEmail,
    to: to,
    cc: [hr_email, intern.InternEmail],
    subject: "Internship Ending Soon – Action Required",
    html: `
      <p>Dear <b>${intern.ManagerName}</b>,</p>
      <p>This is to inform you that the internship of <b>${intern.FullName}</b> in your team is scheduled to conclude on <b>${formattedDate}</b>, which is 10 days from today.</p>
      <p>Please take necessary actions regarding:</p>
      <ul>
        <li>Completion of pending tasks or handover.</li>
        <li>Return of all assigned assets (laptop, ID card, access cards).</li>
        <li>Final feedback or performance evaluation submission.</li>
        <li>Clearance or exit formalities if applicable.</li>
      </ul>
      <p>Thank you,<br><b>IITM WorkSphere Portal</b></p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Reminder sent for ${intern.FullName}`);
}

async function checkAndSendReminders() {
    console.log("enter");
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
    s.Official_Email_Address AS ManagerEmail,
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

    console.log(interns);
    console.log("📅 Reminder check complete.");
  } catch (error) {
    console.error("❌ Error in reminder scheduler:", error.message);
  }
}

function startScheduler() {
    nodecron.schedule('* * * * *', async () => {
        try {
            console.log("Running scheduler...");
            checkAndSendReminders();
            let logs = await getLogsExpiringInThirtyDays();
            let logsFifteenDays=await getLogsExpiringInFifteenDays();
            let mails = await getMails();
            if(!mails){
                console.log('No mails found for scheduler');
                return;
            }
            if(logs){
                logs.forEach(log => {
                    mails.forEach(mail => {
                        sendAlert(mail.mail,30,log.name,log.port,log.designation,convertToDDMMYYYY(log.contract_end_date.toLocaleString().split(',')[0]));
                    });
                })
            }
            if(logsFifteenDays){
                logsFifteenDays.forEach(log => {
                    mails.forEach(mail => {
                        sendAlert(mail.mail,15,log.name,log.port,log.designation,convertToDDMMYYYY(log.contract_end_date.toLocaleString().split(',')[0]));
                    })
                })
            }

        } catch (err) {
            console.error('Error in cron job:', err);
        }
    });

    console.log("Scheduler started. Running every 10 seconds...");
}

function convertToDDMMYYYY(dateString) {
    const [month, day, year] = dateString.split('/');
    return `${day}/${month}/${year}`;
}




module.exports = {startScheduler};