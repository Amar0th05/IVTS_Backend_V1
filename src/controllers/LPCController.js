const {sql,getPool} = require('../config/dbconfig');
const {sendIndentApprovalAlert} = require("../Utils/IndentMailer");
const {findOne} = require("./indentsController");



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.log(err);
    }
})();

async function createRecord(req, res) {
    try {
        const request = await pool.request();
        const IndentID = req.params.id;
        const data = req.body;
        const file = req.file;

        if (!IndentID) {
            return res.status(400).send({ message: "Indent ID is required" });
        }

        if (!data) {
            return res.status(400).send({ message: "Data is required" });
        }

        if (!data.DocumentsProcessedDate) {
            return res.status(400).send({ message: "Document Processed Date is required" });
        }

        if (!data.DocumentsDispatchedDate) {
            return res.status(400).send({ message: "Document Dispatched Date is required" });
        }

        if (!data.DocumentsReceivedDate) {
            return res.status(400).send({ message: "Document Received Date is required" });
        }

        if (!data.CompletionDate) {
            return res.status(400).send({ message: "Completion Date is required" });
        }

        if (!req.user?.id) {
            return res.status(401).send({ message: "Unauthorized: user not identified" });
        }

        request.input('IndentID', IndentID);
        request.input('DocumentsProcessedDate', data.DocumentsProcessedDate);
        request.input('DocumentsDispatchedDate', data.DocumentsDispatchedDate);
        request.input('DocumentsReceivedDate', data.DocumentsReceivedDate);
        request.input('CompletionDate', data.CompletionDate);
        request.input('SupportDocument', sql.VarBinary(sql.MAX), file ? file.buffer : null);
        request.input('ProcessedBy', req.user.id);
        request.input('Remarks', data.Remarks ?? null);

        const query = `
            INSERT INTO tbl_lpc_processing
            (IndentID, DocumentsProcessedDate, DocumentsDispatchedDate, DocumentsReceivedDate, CompletionDate, SupportDocument, ProcessedBy, Remarks)
            VALUES (
                       @IndentID, @DocumentsProcessedDate, @DocumentsDispatchedDate, @DocumentsReceivedDate, @CompletionDate, @SupportDocument, @ProcessedBy, @Remarks
                   );
        `;

        const result = await request.query(query);


        if (result.rowsAffected[0] > 0) {
            let indent=await findOne(IndentID);

            let mailData={
                IndentID:indent.IndentID,
                CreatedBy:req.user.name,
                items:indent.items,
                price:indent.Price,
                ProjectNo:indent.ProjectNo,
                TypeOfIndent:indent.TypeOfIndent,
                indentMode:indent.ModeOfPurchase,
                indentPurpose:indent.Purpose,
                ExtraGST:indent.ExtraGST,
                Price:indent.Price,
                Payment:indent.PaymentTerms,
                DeliveryPlace:indent.DeliveryPlace,
                VendorName:indent.VendorName,
                VendorAddress:indent.VendorAddress,
                VendorPhone:indent.VendorPhone,
                VendorMail:indent.VendorEmail,
                VendorGST:indent.VendorGSTNO,
                VendorPAN:indent.VendorPANNO,
                VendorAccount:indent.VendorAccountNumber,
                VendorIFSC:indent.VendorIFSC,
                Delivery:indent.Delivery
            }
            sendIndentApprovalAlert(mailData).catch(err=>console.log(err));

            return res.status(200).json({ message: "LPC COMPLETED" });
        }

        return res.status(500).json({ message: "Something went wrong" });

    } catch (err) {
        console.log("LPC Processing Error:", err);
        return res.status(500).send({ message: err.message || 'Internal Server Error' });
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
            SELECT LPCID,
                   DocumentsProcessedDate,
                   DocumentsDispatchedDate,
                   DocumentsReceivedDate,
                   CompletionDate,
                   CASE WHEN SupportDocument IS NOT NULL THEN 1 ELSE 0 END AS HasDocument,
                   u.name AS Username,
                   ProcessedBy,
                   lp.Remarks,
                   lp.ProcessedAt
            FROM dbo.tbl_lpc_processing lp
                     LEFT JOIN tbl_user u ON u.id = lp.ProcessedBy
            WHERE lp.IndentID =@IndentID;
        `);




        if (result.recordset.length > 0) {

            return res.status(200).json({ record: result.recordset[0] });
        } else {
            return res.status(404).json({ message: "Record not found" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

async function downloadDocument(req, res) {
    try {
        let IndentID = req.params.id;

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is required" });
        }

        let request = await pool.request();
        request.input('IndentID', IndentID);

        let result = await request.query(`
            SELECT SupportDocument
            FROM dbo.tbl_lpc_processing
            WHERE IndentID = @IndentID
        `);

        if (result.recordset.length > 0 && result.recordset[0].SupportDocument) {
            res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(result.recordset[0].SupportDocument);
        } else {
            return res.status(404).json({ message: "Document not found" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}




module.exports = {createRecord,getRecordById,downloadDocument};