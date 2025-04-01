require('dotenv').config();
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
   service: 'hotmail',
   auth:{
       user:process.env.EMAIL_SENDER,
       pass:process.env.EMAIL_PASSWORD
   }
});


async function getMails(){
    try{
        const request = await pool.request();
        const query = `select mail from tbl_user where role in (2,1);`
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

function startScheduler() {
    nodecron.schedule('0 10 * * *', async () => {
        try {
            console.log("Running scheduler...");
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