const mailer = require('nodemailer');
require('dotenv').config();
const {sql,getPool} = require('../config/dbconfig')


const transporter=mailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_SENDER,
        pass:process.env.EMAIL_PASSWORD,
    }
});

const sendResetMail=async(email,token)=>{
    const mailOptions={
        from:process.env.EMAIL_SENDER,
        to:email,
        subject:'Reset Password',
        html:`<h1>Hello</h1>
        <p>Please click on the link to reset your password</p>
        <a href="${process.env.CLIENT_URL}/reset-password.html?token=${token}">Reset Password</a>`
    }
    await transporter.sendMail(mailOptions);
    return true;
};

module.exports={
    sendResetMail
}