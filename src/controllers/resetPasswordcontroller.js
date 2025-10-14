const { sql, getPool } = require('../config/dbconfig.js');
const { generateToken, verifyToken } = require('../Utils/jwtUtil');
const { sendResetMail } = require('../Utils/mailer');
require('dotenv').config();
const { hash } = require('../Utils/hash');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (error) {
        console.error("Connection error on reset password controller: ", error);
    }
})();

async function sendResetPasswordMail(req, res) {
    const { mail } = req.body;

    if (!mail) {
        return res.status(400).json({ message: "Invalid mail" });
    }

    const request = pool.request();
    request.input('mail', sql.NVarChar(320), mail);

    try {
        const query = "SELECT * FROM tbl_user WHERE mail = @mail";
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = generateToken({mail});

        request.input('token', sql.VarChar(500), token);
        request.input('expires', sql.DateTime, new Date(Date.now() + 3600000));

        await request.query("UPDATE tbl_user SET resetToken = @token, tokenExpiration = @expires WHERE mail = @mail");

        await sendResetMail(mail, token);
        return res.status(200).json({ message: "Password reset mail sent" });
    } catch (err) {
        console.error("Error in sendResetPasswordMail: ", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function resetPassword(req, res) {
    const {password, token} = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }
    if(!token){
        return res.status(400).json({ message: "Token is required" });
    }
    const mail = verifyToken(token).mail;
    const request = pool.request();

    try {

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(400).json({ message: "Invalid token" });
        }

        request.input('token', sql.VarChar(500), token);
        const result = await request.query("SELECT * FROM tbl_user WHERE resetToken = @token");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Invalid token" });
        }

        const user = result.recordset[0];


        if (new Date(user.tokenExpiration) < new Date()) {
            return res.status(400).json({ message: "Token expired" });
        }


        const hashedPassword = await hash(password);

        request.input('password', sql.NVarChar(255), hashedPassword);
        request.input('mail', sql.NVarChar(320), mail);

        await request.query("UPDATE tbl_user SET password = @password, resetToken = NULL, tokenExpiration = NULL WHERE mail = @mail");

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Error in resetPassword: ", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}
async function changePassword(req, res) {
     const userData=req.body.userData;

    try{

        let updates=[];

        const request=await pool.request();

        if(!userData){
            return res.status(404).json({message:"User not found"});
        }

        if(!userData.userID){
            return res.status(404).json({message:"User not found"});
        }

        request.input('id',sql.Int,userData.userID);

        if (userData.name !== undefined) {
            updates.push("name = @name");
            request.input('name', sql.NVarChar(30), userData.name);
        }

        if(userData.mail!==undefined){
            if(isValidEmail(userData.mail)) {
                updates.push("mail = @mail");
                request.input('mail', sql.NVarChar(320), userData.mail);
            }else{
                return res.status(400).json({message:"Invalid email"});
            }
        }

        if(userData.role!==undefined){
            updates.push("role = @role");
            request.input('role',sql.Int,userData.role);
        }

        if(userData.password !== undefined && userData.password.trim()!==''){
            updates.push("password = @password");
            request.input('password',sql.NVarChar(255),await hash(userData.password));
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        const query=`
                
                UPDATE tbl_user SET ${updates.join(',')}
                WHERE id=@id;
        `;
        const result=await request.query(query);
        if(result.rowsAffected[0]===0){
            return res.status(404).json({message:"User not found"});
        }
        return res.status(200).json({message:"user updated successfully"});

    }catch (err){
        console.error(err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

module.exports = {
    sendResetPasswordMail,
    resetPassword,
    changePassword,
};