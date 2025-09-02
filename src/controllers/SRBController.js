const {sql,getPool} = require('../config/dbconfig');



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();


// const sql = require('mssql');

async function createRecord(req, res) {
    console.log("POs");

    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    try {
        let IndentID = req.params.id;
        let data = req.body;

        if (!IndentID) return res.status(400).send({ message: "Missing required field : IndentID" });
        if (!data) return res.status(400).send({ message: "No Data received" });
        if (!req.file) return res.status(400).send({ message: "Please upload a file" });

        const requiredFields = ['SRBFor','Type', 'PONumber', 'EmpName', 'Discount', 'DeductedAmount', 'InvoiceNo', 'InvoiceDate', 'Warranty', 'Others','OtherCharges', 'GSTAmount', 'GrandTotal'];
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                return res.status(400).send({ message: `Missing required field: ${field}` });
            }
        }



        const documentBuffer = req.file.buffer;


        try {
            await transaction.begin();
        } catch (e) {
            return res.status(500).send({ message: "Failed to start transaction" });
        }

        const request = new sql.Request(transaction);


        request.input('SRBFor', sql.NVarChar(100), data.SRBFor);
        request.input('SerialNo', sql.NVarChar(150), data.SerialNo);
        request.input('IndentID', sql.Int, IndentID);
        request.input('Type', sql.NVarChar(50), data.Type);
        request.input('PONumber', sql.NVarChar(150), data.PONumber);
        request.input('PODate', sql.DateTime, data.PODate || null);
        request.input('EmpName', sql.NVarChar(100), data.EmpName);
        request.input('Discount', sql.Decimal(10, 2), data.Discount);
        request.input('DeductedAmount', sql.Decimal(10, 2), data.DeductedAmount);
        request.input('InvoiceNo', sql.NVarChar(150), data.InvoiceNo);
        request.input('InvoiceDate', sql.DateTime, data.InvoiceDate);
        request.input('Warranty', sql.NVarChar(255), data.Warranty);
        request.input('OtherCharges', sql.Decimal(10, 2), data.OtherCharges);
        request.input('GSTAmount', sql.Decimal(12, 2), data.GSTAmount);
        request.input('GrandTotal', sql.Decimal(12, 2), data.GrandTotal);
        request.input('Document', sql.VarBinary(sql.MAX), documentBuffer);
        request.input('CreatedAt', sql.DateTime, new Date());
        request.input('CreatedBy', sql.Int, req.user.id);
        request.input('Others',data.Others);

        console.log(data);

        await request.query(`
            INSERT INTO tbl_srb
            (SRBFor, SerialNo, IndentID, Type, PONumber, PODate, EmpName, Discount, DeductedAmount, InvoiceNo, InvoiceDate, Warranty,Others, OtherCharges, GSTAmount, GrandTotal, Document, CreatedBy, CreatedAt)
            VALUES
                (@SRBFor, @SerialNo, @IndentID, @Type, @PONumber, @PODate, @EmpName, @Discount, @DeductedAmount, @InvoiceNo, @InvoiceDate, @Warranty, @Others,@OtherCharges, @GSTAmount, @GrandTotal, @Document, @CreatedBy, getdate())
        `);


        const updateResult = await request.query(`
            UPDATE tbl_indents 
            SET CurrentStage = 'Awaiting For ICSR Submission', StageUpdatedAt = GETDATE() 
            WHERE IndentID = @IndentID
        `);

        if (updateResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(500).json({ message: "Failed to update indent stage" });
        }

        await transaction.commit();
        return res.status(200).json({ message: "SRB created and indent updated successfully" });

    } catch (err) {
        console.error("Error in createRecord:", err);
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        return res.status(500).send({ message: err.message || "Internal server error" });
    }
}

// without PO
async function createRecordPo(req, res) {
    console.log("enter PO");
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);

    try {
        let data = req.body;

        if (!data) return res.status(400).send({ message: "No Data received" });
        if (!req.file) return res.status(400).send({ message: "Please upload a file" });

        // const requiredFields = ['SRBFor','Type', 'PONumber', 'EmpName', 'Discount', 'DeductedAmount', 'InvoiceNo', 'InvoiceDate', 'Warranty', 'Others','OtherCharges', 'GSTAmount', 'GrandTotal'];
        // for (const field of requiredFields) {
        //     if (data[field] === undefined || data[field] === null || data[field] === '') {
        //         return res.status(400).send({ message: `Missing required field: ${field}` });
        //     }
        // }



        const documentBuffer = req.file.buffer;


        try {
            await transaction.begin();
        } catch (e) {
            return res.status(500).send({ message: "Failed to start transaction" });
        }

        const request = new sql.Request(transaction);


        request.input('srbproductNo', sql.VarChar(50), data.srbproductNo);
        request.input('srbSerialNo', sql.VarChar(50), data.srbSerialNo);
        request.input('srbType', sql.VarChar(50), data.srbType);
        request.input('srbDescription', sql.VarChar(500), data.srbDescription);
        request.input('srbQuantity', sql.Decimal(10, 2), data.srbQuantity);
        request.input('srbUnit', sql.VarChar(20), data.srbUnit);
        request.input('srbUnitprice', sql.Decimal(12, 2), data.srbUnitprice);
        request.input('srbTotalprice', sql.Decimal(12, 2), data.srbTotalprice);
        request.input('srbVendorName', sql.VarChar(50), data.srbVendorName);
        request.input('srbInvoiceNumber', sql.VarChar(20), data.srbInvoiceNumber);
        request.input('srbInvoiceDate', sql.Date, data.srbInvoiceDate);
        request.input('srbGSTAmount', sql.Decimal(12, 2), data.srbGSTAmount);
        request.input('srbOtherCharges', sql.Decimal(12, 2), data.srbOtherCharges);
        request.input('srbGrandTotal', sql.Decimal(12, 2), data.srbGrandTotal);
        request.input('Document', sql.VarBinary(sql.MAX), documentBuffer);


        console.log(data);

        await request.query(`
            INSERT INTO tbl_withoutPo
            (ProductNo, SerialNo, Type, Description, Quantity, Unit, UnitPrice, TotalPrice, VendorName, InvoiceNo, InvoiceDate, GSTAmount, OtherCharges, GrandTotal, Document)
            VALUES
                (@srbproductNo, @srbSerialNo, @srbType, @srbDescription,@srbQuantity,@srbUnit,@srbUnitprice,@srbTotalprice,@srbVendorName,@srbInvoiceNumber,@srbInvoiceDate,@srbGSTAmount,@srbOtherCharges,@srbGrandTotal,@Document)
        `);


        // const updateResult = await request.query(`
        //     UPDATE tbl_indents 
        //     SET CurrentStage = 'Awaiting For ICSR Submission', StageUpdatedAt = GETDATE() 
        //     WHERE IndentID = @IndentID
        // `);

        // if (updateResult.rowsAffected[0] === 0) {
        //     await transaction.rollback();
        //     return res.status(500).json({ message: "Failed to update indent stage" });
        // }

        await transaction.commit();
        return res.status(200).json({ message: "SRB created and indent updated successfully" });

    } catch (err) {
        console.error("Error in createRecord:", err);
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        return res.status(500).send({ message: err.message || "Internal server error" });
    }
}

async function getRecordById(req, res) {
    try {
        let IndentID = req.params.id;

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is required" });
        }

        const request = await pool.request();
        request.input('IndentID', IndentID);

        const result = await request.query(`
      SELECT 
        srb.SRBID, srb.SRBFor, srb.SerialNo, srb.IndentID, srb.Type, srb.PONumber, 
        srb.PODate, srb.EmpName, srb.Discount, srb.DeductedAmount, srb.InvoiceNo, 
        srb.InvoiceDate, srb.Warranty, srb.Others, srb.OtherCharges, srb.GSTAmount, 
        srb.GrandTotal,srb.CreatedBy,srb.CreatedAt,
        CASE 
          WHEN srb.Document IS NOT NULL THEN 1
          ELSE 0 
        END AS HasDocument,
        u.name AS Username
      FROM tbl_srb srb
      LEFT JOIN tbl_user u ON u.id = srb.CreatedBy
      WHERE srb.IndentID = @IndentID;
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        return res.status(200).json({ record: result.recordset[0] });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function downloadDocument(req, res) {
    try {
        let IndentID = req.params.id;

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is required" });
        }

        const request = await pool.request();
        request.input('IndentID', IndentID);

        const result = await request.query(`
      SELECT 
        srb.Document
      FROM tbl_srb srb
      LEFT JOIN tbl_user u ON u.id = srb.CreatedBy
      WHERE srb.IndentID = @IndentID;
    `);

        if (result.recordset.length === 0 || !result.recordset[0].Document) {
            return res.status(404).json({ message: "No document found for this IndentID" });
        }

        const document = result.recordset[0].Document;
        res.setHeader('Content-Disposition', 'attachment; filename="SRBDocument.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(document);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}


module.exports= {createRecord,createRecordPo,getRecordById,downloadDocument}