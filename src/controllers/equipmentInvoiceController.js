const {sql,getPool} = require('../config/dbconfig');



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.log(err);
    }
})();


async function groupInvoicesByProjectNumber(req,res){
    try{
        const request=await pool.request();
        const result = await request.query(`SELECT o.organisation_name as organisation, i.projectNO, COUNT(i.invoiceID) as count
                                            FROM tbl_equipment_invoices i
                                            LEFT JOIN mmt_organisation o ON o.org_id = i.port
                                            GROUP BY o.organisation_name, i.projectNO
                                            ORDER BY o.organisation_name ASC;
                                          `);

        if(result.recordset.length>0){
            return res.status(200).send({invoices:result.recordset});
        }
        return res.status(404).send({error:"No record found"});
    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal Server Error'});
    }
}
async function getInvoicesByProjectNumber(req,res){
    try{
        let projectNumber=req.params.id;
        const request=await pool.request();
        request.input('projectNo',projectNumber);
        const result=await request.query('SELECT * FROM tbl_equipment_invoices WHERE projectNo=@projectNo;');
        if(result.recordset.length>0){
            return res.status(200).send({invoices:result.recordset});
        }
        return res.status(404).send({error:"No record found"});
    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal Server Error'});
    }
}

async function addInvoice(req, res) {
    try {
        let { port, projectNumber, invoiceNumber, invoiceSubject, invoiceAmount, gst, totalInvoiceAmount, invoiceSubmittedDate, fundReceivedFromPort } = req.body;

        let missingFields = [];
        if (!port) missingFields.push("port");
        if (!projectNumber) missingFields.push("projectNumber");
        if (!invoiceNumber) missingFields.push("invoiceNumber");

        if (missingFields.length > 0) {
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
        }

        let columns = ["port", "projectNO", "invoiceNumber"];
        let values = ["@port", "@projectNO", "@invoiceNumber"];
        let params = { port, projectNO: projectNumber, invoiceNumber };

        if (invoiceSubject) {
            columns.push("invoiceSubject");
            values.push("@invoiceSubject");
            params.invoiceSubject = invoiceSubject;
        }
        if (invoiceAmount) {
            columns.push("invoiceAmount");
            values.push("@invoiceAmount");
            params.invoiceAmount = invoiceAmount;
        }
        if (gst) {
            columns.push("gst");
            values.push("@gst");
            params.gst = gst;
        }
        if (invoiceSubmittedDate) {
            const dateObj = new Date(invoiceSubmittedDate);
            if (!isNaN(dateObj.getTime())) {
                invoiceSubmittedDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
                columns.push("invoiceSubmittedDate");
                values.push("@invoiceSubmittedDate");
                params.invoiceSubmittedDate = invoiceSubmittedDate;
            } else {
                return res.status(400).json({ error: "Invalid date format" });
            }
        } else {
            columns.push("invoiceSubmittedDate");
            values.push("NULL");
        }
        if (fundReceivedFromPort) {
            columns.push("fundReceivedFromPort");
            values.push("@fundReceivedFromPort");
            params.fundReceivedFromPort = fundReceivedFromPort;
        }

        const query = `INSERT INTO tbl_equipment_invoices (${columns.join(", ")}) VALUES (${values.join(", ")})`;

        const request = pool.request();
        for (const key in params) {
            if (params[key] !== null) {
                request.input(key, params[key]);
            }
        }

        const result = await request.query(query);

        if (result.rowsAffected[0] > 0) {
            return res.status(201).json({ message: "Invoice added successfully" });
        }

        return res.status(400).json({ error: "Failed to add invoice" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

async function updateInvoice(req, res) {
    try {
        const request = pool.request();
        const { data } = req.body;



        if (!data) return res.status(400).json({ message: "No inputs found" });
        if (!data.invoiceID) return res.status(400).json({ message: "Invoice ID is required" });

        let updates = [];

        request.input("invoiceID", sql.Int, data.invoiceID);

        if (data.port !== undefined) {
            updates.push("port = @port");
            request.input("port", sql.Int, data.port);
        }

        if (data.projectNO !== undefined) {
            updates.push("projectNO = @projectNO");
            request.input("projectNO", sql.NVarChar(255), data.projectNO);
        }

        if (data.invoiceNumber !== undefined) {
            updates.push("invoiceNumber = @invoiceNumber");
            request.input("invoiceNumber", sql.NVarChar(255), data.invoiceNumber);
        }

        if (data.invoiceSubject !== undefined) {
            updates.push("invoiceSubject = @invoiceSubject");
            request.input("invoiceSubject", sql.NVarChar, data.invoiceSubject);
        }

        if (data.invoiceAmount !== undefined) {
            updates.push("invoiceAmount = @invoiceAmount");
            request.input("invoiceAmount", sql.Decimal(10, 2), data.invoiceAmount);
        }

        if (data.gst !== undefined) {
            updates.push("gst = @gst");
            request.input("gst", sql.Decimal(10, 2), data.gst);
        }

        if (data.totalInvoiceAmount !== undefined) {
            updates.push("totalInvoiceAmount = @totalInvoiceAmount");
            request.input("totalInvoiceAmount", sql.Decimal(11, 2), data.totalInvoiceAmount);
        }

        if (data.invoiceSubmittedDate !== undefined) {
            const dateObj = new Date(data.invoiceSubmittedDate);
            if (!isNaN(dateObj.getTime())) {
                updates.push("invoiceSubmittedDate = @invoiceSubmittedDate");
                request.input("invoiceSubmittedDate", sql.Date, dateObj.toISOString().slice(0, 19).replace("T", " "));
            } else {
                return res.status(400).json({ message: "Invalid date format for invoiceSubmittedDate" });
            }
        }

        if (data.fundReceivedFromPort !== undefined) {
            const dateObj = new Date(data.fundReceivedFromPort);
            if (!isNaN(dateObj.getTime())) {
                updates.push("fundReceivedFromPort = @fundReceivedFromPort");
                request.input("fundReceivedFromPort", sql.Date, dateObj.toISOString().slice(0, 19).replace("T", " "));
            } else {
                return res.status(400).json({ message: "Invalid date format for fundReceivedFromPort" });
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No fields provided for update" });
        }

        const query = `UPDATE tbl_equipment_invoices SET ${updates.join(", ")} WHERE invoiceID = @invoiceID`;
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "No matching records found to update" });
        }

        res.json({ message: "Invoice updated successfully" });
    } catch (err) {
        console.error("Error updating invoice:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


module.exports = {
    groupInvoicesByProjectNumber,
    getInvoicesByProjectNumber,
    addInvoice,
    updateInvoice
}