const User=require('../models/User');
const {sql}=require('../config/dbconfig');
const {hash}=require('../Utils/hash');



async function registerUser(req, res) {
    try {
        const data = req.body;
        const request = new sql.Request();


        if (!data) {
            return res.status(400).json({ message: "No data provided" });
        }


        const requiredFields = ['name', 'mail', 'password', 'role'];
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === "") {
                return res.status(400).json({ message: `${field} is required` });
            }
        }


        if (!data.status || data.status.trim() === "") {
            data.status = 1;
        }


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

module.exports={registerUser};