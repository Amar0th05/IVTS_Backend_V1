const {sql,getPool} = require('../config/dbconfig');

let pool;

(async () => {
    try{
        pool=await getPool();
    }catch(err){
        console.log("Error establishing database connection at PO Approval Controller : ",err);
    }
})();

async function createRecord(req, res) {
    const transaction = new sql.Transaction(pool);
    try {
        let IndentID = req.params.id;
        let data = req.body;

        if (!IndentID) return res.status(400).json({ message: "Missing Required Field: Indent ID" });
        if (!data || Object.keys(data).length === 0) return res.status(400).json({ message: "Missing Data" });

        const file = req.file;
        if (!data.SignedPOMailedDate) return res.status(400).json({ message: "Missing Required Field: Signed PO Mailed Date" });
        if (!file || !file.buffer) return res.status(400).json({ message: "Invalid or Missing Signed PO File" });

        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input('SignedPOMailedDate', data.SignedPOMailedDate);
        request.input('IndentID', IndentID);
        request.input('SignedPO', file.buffer);
        request.input('GeneratedBy', req.user.id);
        request.input('PONumber', 'PO' + IndentID);

        // console.log(data);
        // console.log(req.file);
        //
        // return res.status(201).json({});

        const insertQuery = `
            INSERT INTO tbl_po_generation (IndentID, PONumber, SignedPOMailedDate, SignedPO, GeneratedAt, GeneratedBy)
            VALUES (@IndentID, @PONumber, @SignedPOMailedDate, @SignedPO, GETDATE(), @GeneratedBy)
        `;

        const result = await request.query(insertQuery);
        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(500).json({ message: "Failed to insert PO generation record" });
        }

        const updateQuery = `
            UPDATE tbl_indents 
            SET CurrentStage='Awaiting For SRB Creation', StageUpdatedAt=GETDATE() 
            WHERE IndentID=@IndentID
        `;

        await request.query(updateQuery);
        await transaction.commit();

        return res.status(200).json({ message: "PO Generation Successful" });

    } catch (err) {
        if (transaction._aborted !== true) await transaction.rollback();
        console.log('Error in PoGenerated Controller:', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
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
        pg.POGenerationID, 
        pg.PONumber, 
        pg.SignedPOMailedDate, 
        pg.SignedPO,
        CASE WHEN pg.SignedPO IS NOT NULL THEN 1 ELSE 0 END AS HasDocument, 
        pg.GeneratedAt, 
        pg.GeneratedBy,
        u.name AS GeneratedByName
      FROM tbl_po_generation pg
      LEFT JOIN tbl_user u ON u.id = pg.GeneratedBy
      WHERE pg.IndentID = @IndentID;
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        const record = result.recordset[0];
        if (record.HasDocument) {
            return res.status(200).json({
                message: "Document found",
                record: record
            });
        } else {
            return res.status(200).json({
                message: "Document not available",
                record: record
            });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
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
        pg.POGenerationID, 
        pg.PONumber, 
        pg.SignedPOMailedDate,
        pg.GeneratedAt, 
        pg.GeneratedBy,
        u.name AS Username,
        CASE WHEN pg.SignedPO IS NOT NULL THEN 1 ELSE 0 END AS HasDocument
      FROM tbl_po_generation pg
      LEFT JOIN tbl_user u ON u.id = pg.GeneratedBy
      WHERE pg.IndentID = @IndentID;
    `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Record not found" });
        }

        return res.status(200).json({record:result.recordset[0]});

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
        SignedPO
      FROM tbl_po_generation
      WHERE IndentID = @IndentID;
    `);

        if (result.recordset.length === 0 || !result.recordset[0].SignedPO) {
            return res.status(404).json({ message: "No document found for this IndentID" });
        }

        const document = result.recordset[0].SignedPO;
        res.setHeader('Content-Disposition', 'attachment; filename="SignedPO.pdf"');
        res.setHeader('Content-Type', 'application/pdf');

        res.send(document);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}



module.exports = {createRecord,getRecordById,downloadDocument};