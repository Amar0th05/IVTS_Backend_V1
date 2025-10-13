import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const hr_email = process.env.HR_EMAIL;
const to = process.env.To;


async function sendInternReminderMail(intern) {
  const mailOptions = {
    from: `"IITM WorkSphere Portal" <${process.env.EMAIL_SENDER}>`,
    // to: intern.ManagerEmail,
    to: to,
    cc: [hr_email, intern.InternEmail],
    subject: "Internship Ending Soon – Action Required",
    html: `
      <p>Dear <b>${intern.ManagerName}</b>,</p>
      <p>This is to inform you that the internship of <b>${intern.FullName}</b> in your team is scheduled to conclude on <b>${intern.EndDate}</b>, which is 10 days from today.</p>
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
