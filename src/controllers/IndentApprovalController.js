const { sql, getPool } = require('../config/dbconfig');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error('Error while getting pool in employee insurance controller', err);
    }
})();

async function createRecord(req, res) {
    try {
        const IndentID = req.params.id;
        const data = req.body;
        const file = req.file;

        if (!IndentID) return res.status(400).json({ message: "Indent ID is required" });
        if (!data || !data.Status) return res.status(400).json({ message: "Status is missing" });


        let request = await pool.request();
        request.input('IndentID', IndentID);
        request.input('Status', data.Status);
        request.input('Remarks', data.Remarks || null);
        request.input('SupportDocument', sql.VarBinary(sql.MAX), file ? file.buffer : null);
        request.input('ActionBy', req.user.id);

        await request.query(`
            INSERT INTO tbl_indent_approvals
            (IndentID, Status, Remarks, SupportDocument, ActionBy)
            VALUES (@IndentID, @Status, @Remarks, @SupportDocument, @ActionBy);
        `);


        request = await pool.request();
        request.input('IndentID', IndentID);

        let stage = 'Reverted Back';
        if (data.Status === 'Approved') stage = 'Awaiting For PO Approval';
        else if (data.Status === 'Rejected') stage = 'Rejected';

        request.input('CurrentStage', stage);

        await request.query(`
            UPDATE tbl_indents 
            SET CurrentStage = @CurrentStage, StageUpdatedAt = GETDATE()
            WHERE IndentID = @IndentID;
        `);

        return res.status(201).json({ message: "Indent status recorded successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'Internal Server Error' });
    }
}

async function getRecordById(req, res) {
    try {
        let IndentID = req.params.id;

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is required" });
        }

        let request = await pool.request();
        request.input('IndentID', IndentID);

        let result = await request.query(`
            select a.ApprovalID, a.Status, a.Remarks,
                   CASE
                       WHEN a.SupportDocument IS NOT NULL THEN 1
                       ELSE 0
                       END AS HasDocument,
                   a.ActionAt, a.ActionBy, u.name as Username
            from tbl_indent_approvals a
                     left join tbl_user u on u.id = ActionBy
            where IndentID = @IndentID;
        `);

        if (result.recordset.length > 0) {
            return res.status(200).json({ record: result.recordset[0] });
        }

        return res.status(404).json({ message: "Record not found" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

async function downloadDocument(req, res) {
    try {
        let ApprovalID = req.params.id;

        if (!ApprovalID) {
            return res.status(400).json({ message: "Approval ID is required" });
        }

        let request = await pool.request();
        request.input('ApprovalID', ApprovalID);

        let result = await request.query(`
            select SupportDocument
            from tbl_indent_approvals
            where ApprovalID = @ApprovalID;
        `);

        if (result.recordset.length > 0 && result.recordset[0].SupportDocument) {
            res.set('Content-Type', 'application/pdf');
            res.send(result.recordset[0].SupportDocument);
        } else {
            return res.status(404).json({ message: "Document not found" });
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

module.exports={createRecord,getRecordById,downloadDocument};