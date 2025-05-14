const mailer = require('nodemailer');
require('dotenv').config();
const {sql,getPool} = require('../config/dbconfig')


const transporter=mailer.createTransport({
    // host: "smtp.office365.com",
    // port: 587,
    // secure: false,
    service: 'gmail',
    auth:{
        user:process.env.EMAIL_SENDER,
        pass:process.env.EMAIL_PASSWORD,
    }
});

const sendResetMail=async(email,token)=>{
    console.log(process.env.CLIENT_URL);
    const mailOptions={
        from:process.env.EMAIL_SENDER,
        to:email,
        subject:'Reset Password',
        html:`
        
    <div style="max-width: 500px; margin: auto; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif; text-align: center;">
    <h1 style="color: #222; font-size: 24px; margin-bottom: 10px;">Reset Your Password</h1>
    <p style="color: #666; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to proceed.</p>
    <a href="${process.env.CLIENT_URL}/reset-password.html?token=${token}" 
       style="display: inline-block; padding: 14px 24px; margin-top: 15px; background: green; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2); transition: 0.3s;">
        Reset Password
    </a>
    <p style="color: #888; font-size: 14px; margin-top: 20px;">If you didn’t request this, you can safely ignore this email.</p>
    </div>
  
        
        `
    }
    await transporter.sendMail(mailOptions);
    return true;
};



module.exports={
    sendResetMail
}