const { sql, getPool } = require("../config/dbconfig");
const multer = require("multer");
const {query} = require("express");

let pool;
(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error while getting pool in invoice controller", err);
    }
})();


async function uploadInvoice(req, res) {


    const date = new Date();
    let month;
    let year = date.getFullYear();

    if(date.getDate()>10){
        month=date.getMonth();
    }else{
        month = date.getMonth() - 1;
    }
    if (month < 0) {
        month = 11;
        year -= 1;
    }

    try {
        if (!req.file || req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Only PDF files are allowed!" });
        }
        if(!req.body.id){

            return res.status(400).json({ message: "missing required parameter : user id" });
        }
        if(!req.body.port){

            return res.status(400).json({ message: "missing required parameter :  port" });
        }


        const request = pool.request();
        request.input("invoice", sql.VarBinary(sql.MAX), req.file.buffer);
        request.input("port",sql.Int,req.body.port);
        request.input("user_id",req.body.id);
        request.input("month",sql.Int,month);
        request.input("year",sql.Int,year);

        const query = `INSERT INTO tbl_o_m_invoices (Invoice,Port,UserId,Year,Month,MailSent) VALUES (@invoice,@port,@user_id,@year,@month,0);`;

        await request.query(query);
        res.json({ message: "PDF uploaded successfully!" });

    } catch (err) {
        console.error("Error uploading PDF: ", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function downloadInvoice(req, res) {
    try {
        const request = pool.request();
        request.input("id", sql.Int, req.params.id);

        const query = `SELECT invoice FROM tbl_o_m_invoices WHERE id = @id;`;
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "File not found!" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="invoice_${req.params.id}.pdf"`);
        res.send(result.recordset[0].invoice);

    } catch (err) {
        console.error("Error downloading PDF: ", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function getMailSentStatus(req, res) {
    try{
        const request = await pool.request();
        const query=`
            select o.organisation_name as organisation,
                   i.MailSent as mailSent,
                   o.org_id
            from mmt_organisation o
                     right join tbl_o_m_invoices i on o.org_id = i.Port
            where i.MailSent=1
            ;
        `;

        const result = await request.query(query);
        if(result.recordset.length === 0) {
            return res.status(404).json({ message: "no records found" });
        }
        return res.status(200).json({statuses:result.recordset});
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

async function getAllInvoices(req, res) {
    try{
        const request = pool.request();
        const query = `select i.Id as id,
                                p.organisation_name as port,
                                i.Year as year,
                                i.Month as month,
                                i.UploadDate as uploadDate,
                                i.MailSent,
                                u.name as uploadedBy
                               from tbl_o_m_invoices i
                               left join mmt_organisation p on p.org_id=i.port
                                left join tbl_user u on u.id=i.UserId
                                where p.org_id!=1;`;
        const result = await request.query(query);
        if(result.recordset.length === 0) {
            return res.status(404).json({ message: "File not found!" });
        }
        return res.status(200).json({invoices: result.recordset});


    }catch(err){
        console.error("Error getting all invoices from invoice controller", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

async function toggleMailSentStatus(req, res) {
    try{
        const id=req.params.id;
        const status=req.body.status;

        if(!req.params.id){
            return res.status(400).json({ message: "missing required parameter : port id" });
        }
        if(status===undefined){
            return res.status(400).json({ message: "missing required parameter : status" });
        }
        const request = pool.request();
        request.input('id',sql.Int,req.params.id);
        request.input('status',sql.Int,status);
        const query=`UPDATE tbl_o_m_invoices SET MailSent = @status WHERE Port = @id`
        const result = await request.query(query);

        if(result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "No invoices uploaded for the port" });
        }
        return res.status(200).json({statuses:result.recordset});

    }catch(err){
        console.error(err.message);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

module.exports = { uploadInvoice, downloadInvoice,getAllInvoices,getMailSentStatus,toggleMailSentStatus };
