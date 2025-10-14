require('dotenv').config();
const { sql, getPool } = require('../config/dbconfig');
const nodecron = require('node-cron');
const mailer = require("nodemailer");
const {startScheduler} = require("./ContractExpiryMailer");

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error initializing database pool:", err);
    }
})();

async function getMails(){
    try{
        const request = await pool.request();
        const query = `select mail from tbl_user
                                            left join tbl_role_module_perms on tbl_role_module_perms.RoleID=tbl_user.role
                       where tbl_role_module_perms.ModuleID=3 and CanWrite=1
        ;
        `;

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

async function getMailSentStatus() {
    try{
        const request = await pool.request();
        const query=`    
            SELECT
                o.organisation_name AS organisation,
                COALESCE(i.MailSent, 0) AS mailSent,
                o.org_id
            FROM mmt_organisation o
                     LEFT JOIN tbl_o_m_invoices i ON o.org_id = i.Port
            WHERE (i.MailSent = 0 OR i.MailSent IS NULL)
              AND o.org_id != 1;

            ;
        `;

        const result = await request.query(query);
        if(result.recordset.length === 0) {
            return null;
        }
        return result.recordset;
    }catch(err){
        console.error(err.message);
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

async function sendAlert(email, organisations) {
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: `Reminder: Pending Submission of Monthly O&M Invoices`,
        html: `
            <b>Dear Admin Team,</b><br><br>

            This is an automated notification to inform you that the monthly O&M invoices have not yet been submitted for the following ports:<br><br>

            <ul>

                ${organisations.map(organisation => `<li><b>${organisation.organisation}</b></li>`).join('')}
            </ul>
            Kindly ensure that the invoices are sent at the earliest.<br><br>

           This is a system-generated message. For further assistance, please contact the relevant department.<br><br>

            <b>Regards,<br>IVTMS Management Portal</b>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Invoice upload alert sent to:', email);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

function startInvoiceUploadScheduler() {
    nodecron.schedule('0 10 10 * *', async () => {
        try {
            console.log("Running invoice upload scheduler...");

            let mails = await getMails();
            let organisations = await getMailSentStatus();

            if (!mails || !organisations) {
                console.log('No emails or pending invoices found.');
                return;
            }

            mails.forEach(email => {
                sendAlert(email.mail, organisations);
            });

        } catch (err) {
            console.error('Error in cron job:', err);
        }
    });

    console.log("Scheduler started. Running daily at 10 AM...");
}


module.exports = {startInvoiceUploadScheduler};