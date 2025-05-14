const {sql,getPool} = require('../config/dbconfig');
const {request} = require("express");



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();




async function createRecord(req, res) {
    let transaction;
    try {
        const IndentID = req.params.id;
        const data = req.body;


        if (!IndentID) {
            return res.status(400).send({ message: "Missing required field: IndentID" });
        }
        if (!data) {
            return res.status(400).send({ message: "Missing data" });
        }


        if (!(data.ApprovalDate || data.RejectionDate)) {
            return res.status(400).send({ message: "Please Enter RejectionDate or ApprovalDate" });
        }


        if (data.RejectionDate && !data.RejectionRemarks) {
            return res.status(400).send({ message: "Missing Required Field: Rejection Remarks" });
        }



        transaction = new sql.Transaction(pool);
        const request = new sql.Request(transaction);

        await transaction.begin();


        request.input('IndentID', sql.Int, IndentID);
        if (data.ApprovalDate) {
            request.input('ApprovalDate', sql.Date, data.ApprovalDate);
            request.input('Status', sql.Bit, 1);
            request.input('RejectionDate', sql.Date, null);
            request.input('RejectionRemarks', sql.NVarChar(500), null);
        } else {
            request.input('RejectionDate', sql.Date, data.RejectionDate);
            request.input('Status', sql.Bit, 0);
            request.input('RejectionRemarks', sql.NVarChar(500), data.RejectionRemarks);
            request.input('ApprovalDate', sql.Date, null);
        }

        request.input('CreatedBy', sql.Int, req.user.id);


        const query = `
            INSERT INTO tbl_icsr_submission (IndentID, ApprovalDate, RejectionDate, RejectionRemarks, Status, CreatedBy) 
            VALUES (@IndentID, @ApprovalDate, @RejectionDate, @RejectionRemarks, @Status, @CreatedBy);
        `;

        await request.query(query);


        const updateQuery = `
            UPDATE tbl_indents 
            SET CurrentStage = 'Completed', StageUpdatedAt = GETDATE() 
            WHERE IndentID = @IndentID
        `;
        const updateResult = await request.query(updateQuery);

        if (updateResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(500).json({ message: "Failed to update indent stage" });
        }

        await transaction.commit();

        return res.status(200).json({ message: "Record created successfully" });

    } catch (err) {
        console.error('Error while creating record', err);


        if (transaction && !transaction._aborted) {
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
        icsr.SubmissionID, icsr.IndentID, icsr.ApprovalDate, icsr.RejectionDate, 
        icsr.RejectionRemarks, icsr.Status,icsr.CreatedBy,icsr.CreatedAt,
        u.name AS Username
      FROM tbl_icsr_submission icsr
      LEFT JOIN tbl_user u ON u.id = icsr.CreatedBy
      WHERE icsr.IndentID = @IndentID;
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


module.exports = { createRecord ,getRecordById};
