const User=require('../models/User');
const {sql,getPool}=require('../config/dbconfig');
const {hash}=require('../Utils/hash');

let pool;

(async ()=>{
    try{
        pool=await getPool();
    }catch(error){
        console.error("connection error: ",error);
    }
})();


//create user
async function registerUser(req, res) {
    try {
        const data = req.body;
        const request = pool.request();


        if (!data) {
            return res.status(400).json({ message: "No data provided" });
        }

        data['role']="data entry operator";

        const requiredFields = ['name', 'mail', 'password', 'role'];
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === "") {
                return res.status(400).json({ message: `${field} is required` });
            }
        }


       data.status=data.status && data.status.trim()!==""?data.status:1;


        const hashedPassword = await hash(data.password);


        const userInstance = new User(null, data.name, data.mail, hashedPassword, data.status, data.role);



        if (!userInstance.isValidEmail()) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        request.input('name', sql.NVarChar(30), userInstance.name);
        request.input('mail', sql.NVarChar(320), userInstance.mail);
        request.input('password', sql.NVarChar(255), userInstance.password);
        request.input('status', sql.Bit, userInstance.status);
        request.input('role', sql.NVarChar(50), userInstance.role);


        const query = `
            INSERT INTO tbl_user (name, mail, password, status, role)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.mail, INSERTED.status, INSERTED.role
            VALUES (@name, @mail, @password, @status, @role);
        `;

        const queryResult = await request.query(query);


        const user = new User(
            queryResult.recordset[0].id,
            queryResult.recordset[0].name,
            queryResult.recordset[0].mail,
            "protected data",
            queryResult.recordset[0].status,
            queryResult.recordset[0].role
        );


        res.status(201).json(user);

    } catch (err) {
        console.error("Error creating user:", err);


        if (err.number === 2627 || err.number === 2601) {
            return res.status(400).json({ message: "Email already exists" });
        }


        res.status(500).json({ message: "Internal Server Error" });
    }
}

//callback funtion to return user in router

async function getUserByEmail(req, res) {
    try {
        const mail= req.body.mail;
        if (!mail || mail.trim() === "") {
            res.status(400).json({ message: "Invalid email address" });
            return;
        }

       const user= await getUser(mail);
        if (!user) {
            return res.status(404).json({message:"User not found"});
        }
        user.password="<PASSWORD>";
        res.json(user);

    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//get user method by mail

async function getUser(mail){

    try{
        const request = new sql.Request();

        request.input('mail', sql.NVarChar(320), mail);

        const query = `SELECT * FROM tbl_user WHERE mail=@mail`;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return null;
        }

        const recordSet = result.recordset[0];

        return new User(recordSet.id, recordSet.name, recordSet.mail, recordSet.password, recordSet.status, recordSet.role);
    }catch(error){
        console.error("Error fetching user:", error);
        return null;
    }

}


module.exports={registerUser,getUserByEmail,getUser};