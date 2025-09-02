const { sql, getPool } = require("../config/dbconfig");
const {getVendorByID} = require("./vendorsController");
const {sendFundCheckAlert, notifyIndenter} = require("../Utils/IndentMailer");

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error while getting pool in invoice controller", err);
    }
})();

async function createIndent(req, res) {
    const transaction = new sql.Transaction(pool);
    try {
        const vendorDetails = JSON.parse(req.body.vendorDetails);
        const itemDetails = JSON.parse(req.body.itemDetails);
        const items = JSON.parse(req.body.items);
        const commercialDetails = JSON.parse(req.body.commercialDetails);
        const projectDetails = JSON.parse(req.body.projectDetails);
        const indentDetails = JSON.parse(req.body.indentDetails);
        const selectedProject = req.body.selectedProject;
        const selectedVendor = req.body.selectedVendor;
        const file = req.file;

        const indentNumber = `IND-${Date.now()}`;

        await transaction.begin();
        const request = new sql.Request(transaction);

            console.log(vendorDetails, itemDetails, items,commercialDetails,projectDetails, indentDetails, selectedProject, selectedVendor);

        request
            .input('IndentNumber', sql.NVarChar, indentNumber)
            .input('ModeOfPurchase', sql.NVarChar, indentDetails.indentMode)
            .input('Purpose', sql.NVarChar, indentDetails.indentPurpose)
            .input('Document', sql.VarBinary, file ? file.buffer : null)
            .input('VendorID', sql.Int, selectedVendor)
            .input('TypeOfIndent', sql.NVarChar, itemDetails.indentType)
            .input('QuotationAvailable', sql.Bit, itemDetails.isQuotationAvailable === 'Yes' ? 1 : 0)
            .input('ExtraGST', sql.Decimal(10, 2), parseFloat(commercialDetails.extraGST || 0))
            .input('Price', sql.Decimal(12, 2), parseFloat(commercialDetails.price || 0))
            .input('TypeOfCurrency', sql.NVarChar, commercialDetails.currency)
            .input('PaymentTerms', sql.NVarChar, commercialDetails.payment)
            .input('DeliveryPlace', sql.NVarChar, commercialDetails.deliveryPlace)
            .input('Delivery', sql.NVarChar, commercialDetails.delivery)
            .input('OtherTerms', sql.NVarChar, commercialDetails.otherTerms)
            .input('ProjectNo', sql.NVarChar, projectDetails.project)
            .input('SubProjectNo', sql.NVarChar, projectDetails.subProject)
            .input('ProjectRemarks', sql.NVarChar, projectDetails.remarks)
            .input('CurrentStage', sql.NVarChar, 'Awaiting For Fund Check')
            .input('CreatedBy', sql.Int, req.user.id);

        const result = await request.query(`
            INSERT INTO tbl_indents (
                IndentNumber, ModeOfPurchase, Purpose, Document, VendorID, TypeOfIndent, QuotationAvailable, 
                ExtraGST, Price, TypeOfCurrency, PaymentTerms, DeliveryPlace, Delivery, OtherTerms, 
                ProjectNo, SubProjectNo, ProjectRemarks, CurrentStage, CreatedBy
            ) 
            OUTPUT INSERTED.IndentID,INSERTED.CreatedAt
            VALUES (
                @IndentNumber, @ModeOfPurchase, @Purpose, @Document, @VendorID, @TypeOfIndent, 
                @QuotationAvailable, @ExtraGST, @Price, @TypeOfCurrency, @PaymentTerms, 
                @DeliveryPlace, @Delivery, @OtherTerms, @ProjectNo, @SubProjectNo, 
                @ProjectRemarks, @CurrentStage, @CreatedBy
            );
        `);

        const indentId = result.recordset[0].IndentID;
        const CreatedAt=result.recordset[0].CreatedAt;

        console.log(items);

        for (const item of items) {
            const itemReq = new sql.Request(transaction);
            await itemReq
                .input('IndentID', sql.Int, indentId)
                .input('ProductName', sql.VarChar(100), item.productName)
                .input('ItemName', sql.VarChar(100), item.name)
                .input('Description', sql.VarChar(500), item.desc)
                .input('ItemClassification', sql.VarChar(50), item.classification)
                .input('Quantity', sql.Decimal(10, 2), parseFloat(item.qty))
                .input('Unit', sql.VarChar(20), item.unit)
                .input('EstimatedUnitPrice', sql.Decimal(12, 2), parseFloat(item.price))
                .input('EstimatedTotalPrice', sql.Decimal(12, 2),parseFloat(item.estTotalPrice))
                .input('Remarks', sql.VarChar(500), item.remarks || null)
                .query(`
                    INSERT INTO tbl_items (
                        IndentID, ProductName, ItemName, Description, ItemClassification,
                        Quantity, Unit, EstimatedUnitPrice,EstimatedTotalPrice, Remarks
                    ) VALUES (
                        @IndentID, @ProductName, @ItemName, @Description, @ItemClassification,
                        @Quantity, @Unit, @EstimatedUnitPrice, @EstimatedTotalPrice,@Remarks
                    );
                `);
        }

        const Emailquery=`select ToEmails,CcEmails from emailManagement WHERE Stage = 'New Indent';`
        const FundCheckquery=`select ToEmails,CcEmails from emailManagement WHERE Stage = 'Fund Check';`
        const emailResult = await request.query(Emailquery);
        const fundCheckResult = await request.query(FundCheckquery);

        await transaction.commit();
        let vendor=await getVendorByID(selectedVendor);
        console.log('selected vendor', selectedVendor);

        let mailData={
            IndentID:indentId,
            CreatedBy:req.user.name,
            CreatedAt:CreatedAt,
            items:items,
            price:commercialDetails.price,
            ProjectNo:projectDetails.project,
            TypeOfIndent:itemDetails.indentType,
            indentMode:indentDetails.indentMode,
            indentPurpose:indentDetails.indentPurpose,
            ExtraGST:commercialDetails.extraGST,
            Price:commercialDetails.price,
            Payment:commercialDetails.payment,
            DeliveryPlace:commercialDetails.deliveryPlace,
            VendorName:vendor.VendorName,
            VendorAddress:vendor.Address,
            VendorPhone:vendor.Phone,
            VendorMail:vendor.Email,
            VendorGST:vendor.GSTNo,
            VendorPAN:vendor.PANNo,
            VendorAccount:vendor.AccountNo,
            VendorIFSC:vendor.IFSCode,
            Delivery:commercialDetails.delivery
        }

        // sendFCAlert(mailData).catch(console.error);
        console.log('Mail data:', req.user.mail, req.user);
        if (emailResult.rowsAffected[0] > 0 && fundCheckResult.rowsAffected[0] > 0) {
            let To = emailResult.recordset[0].ToEmails;   // e.g. "user1@domain.com,user2@domain.com"
            let cc = emailResult.recordset[0].CcEmails; 
            let FTo=fundCheckResult.recordset[0].ToEmails;  // e.g. "cc1@domain.com,cc2@domain.com"
            let FCc=fundCheckResult.recordset[0].CcEmails;  // e.g. "cc1@domain.com,cc2@domain.com"
        notifyIndenter(To,cc, mailData);
        sendFundCheckAlert(FTo, FCc, mailData);

        }
        

        console.log('Indent and items inserted successfully');
        return res.status(201).json({ message: 'Indent created successfully' });
    } catch (err) {
        console.error('INDENTS CONTROLLER:', err);
        await transaction.rollback();
        return res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
}

async function getBasicIndentDetails(req,res){
    try{
        let request=await pool.request();
        let result=await request.query(`
            SELECT
                i.IndentID,
                i.IndentNumber,
                i.ModeOfPurchase,
                i.Purpose,
                v.VendorName,
                i.TypeOfIndent,
                i.QuotationAvailable,
                i.ExtraGST,
                i.Price,
                i.TypeOfCurrency,
                i.PaymentTerms,
                i.DeliveryPlace,
                i.Delivery,
                i.OtherTerms,
                i.ProjectNo,
                i.SubProjectNo,
                i.ProjectRemarks,
                i.CurrentStage,
                i.StageUpdatedAt,
                u.name as CreatedBy,
                i.CreatedBy as userID,
                i.CreatedAt,
                i.UpdatedBy,
                i.UpdatedAt,
                CASE
                    WHEN i.Document IS NULL THEN 0
                    ELSE 1
                    END AS IsDocumentAvailable
            FROM tbl_indents i
                     left join mmt_vendors v on v.VendorID=i.VendorID
            left join tbl_user u on u.id=i.CreatedBy;

        `);

        return res.status(200).json({indents:result.recordset||[]});

    }catch(error){
        console.log('Indents Controller  : ',error);
        return res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
}

async function getIndentById(req,res){
    try{

        let request=await pool.request();

        let id=req.params.id;

        if(!id){
            return res.status(400).json({message:"Indent ID is required"});
        }
        request.input('IndentID',id);

        let query=`
            SELECT i.IndentID,
                   i.IndentNumber,
                   i.ModeOfPurchase,
                   i.Purpose,
                   i.TypeOfIndent,
                   i.QuotationAvailable,
                   i.ExtraGST,
                   i.Price,
                   i.TypeOfCurrency,
                   i.PaymentTerms,
                   i.DeliveryPlace,
                   i.Delivery,
                   i.OtherTerms,
                   i.ProjectNo,
                   i.SubProjectNo,
                   i.ProjectRemarks,
                   p.ProjectIncharge,
                   p.ProjectName,
                   i.CurrentStage,
                   i.StageUpdatedAt,
                   i.CreatedBy,
                   i.CreatedAt,
                   i.UpdatedBy,
                   i.UpdatedAt,
                   CASE
                       WHEN i.Document IS NULL THEN 0
                       ELSE 1
                       END     AS IsDocumentAvailable,
                   v.VendorID,
                   v.VendorName,
                   v.Address   as VendorAddress,
                   v.Phone     as VendorPhone,
                   v.Email     as VendorEmail,
                   v.GSTNo     as VendorGSTNO,
                   v.PANNo     as VendorPANNO,
                   v.AccountNo as VendorAccountNumber,
                   v.IFSCode   as VendorIFSC,
                   v.BankName  as VendorBankName,
                   v.Branch    as VendorBankBranch

            FROM tbl_indents i
                     left join mmt_vendors v on v.VendorID = i.VendorID
                     left join tbl_project_tracking p on p.ProjectID = i.ProjectNo
            where i.IndentID = @IndentID;


        `;

        let result=await request.query(query);

        if(result.recordset.length===0){
            return res.status(404).json({message:"Indent Not Found"});
        }

        let indent=result.recordset[0];

        result=await request.query('SELECT * FROM tbl_items where IndentID=@IndentID;');

        let items=result.recordset||[];

        indent['items']=items;

        return res.status(200).json({indent:indent});

    }catch(error){
        console.log('INDENTS CONTROLLER:', error);
        return res.status(500).json({message:error.message||'Internal Server Error'});
    }
}

async function findOne(IndentID){
    try{

        let request=await pool.request();

        let id=IndentID;

        request.input('IndentID',id);

        let query=`
            SELECT i.IndentID,
                   i.IndentNumber,
                   i.ModeOfPurchase,
                   i.Purpose,
                   i.TypeOfIndent,
                   i.QuotationAvailable,
                   i.ExtraGST,
                   i.Price,
                   i.TypeOfCurrency,
                   i.PaymentTerms,
                   i.DeliveryPlace,
                   i.Delivery,
                   i.OtherTerms,
                   i.ProjectNo,
                   i.SubProjectNo,
                   i.ProjectRemarks,
                   p.ProjectIncharge,
                   p.ProjectName,
                   i.CurrentStage,
                   i.StageUpdatedAt,
                   i.CreatedBy,
                   i.CreatedAt,
                   i.UpdatedBy,
                   i.UpdatedAt,
                   CASE
                       WHEN i.Document IS NULL THEN 0
                       ELSE 1
                       END     AS IsDocumentAvailable,
                   v.VendorID,
                   v.VendorName,
                   v.Address   as VendorAddress,
                   v.Phone     as VendorPhone,
                   v.Email     as VendorEmail,
                   v.GSTNo     as VendorGSTNO,
                   v.PANNo     as VendorPANNO,
                   v.AccountNo as VendorAccountNumber,
                   v.IFSCode   as VendorIFSC,
                   v.BankName  as VendorBankName,
                   v.Branch    as VendorBankBranch

            FROM tbl_indents i
                     left join mmt_vendors v on v.VendorID = i.VendorID
                     left join tbl_project_tracking p on p.ProjectID = i.ProjectNo
            where i.IndentID = @IndentID;


        `;

        let result=await request.query(query);

        if(result.recordset.length===0){
           return null;
        }

        let indent=result.recordset[0];

        result=await request.query('SELECT * FROM tbl_items where IndentID=@IndentID;');

        indent['items']=result.recordset || [];

        return indent;

    }catch(error){
        console.log('INDENTS CONTROLLER:', error);
    }
}

async function getTest(req,res){
    let id=req.params.id;
    let indent=await findOne(id);
    return res.status(200).json({indent:indent});
}
async function downloadDocument(req,res){
    try{

        let IndentID=req.params.id;

        let request=await pool.request();
        request.input('IndentID',IndentID);

        let query=`
                        select Document from tbl_indents where IndentID=@IndentID;
        `;

        const result=await request.query(query);

        if(result.recordset.length===0){
            return res.status(404).json({message:"Document Not Found"});
        }

        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition',`attachment;filename="Indent-${IndentID}.pdf`);
        res.send(result.recordset[0].Document);

    }catch(error){
        console.log('Indents Controller  : ',error);
        return res.status(500).json({message:error.message||'Internal Server Error'});
    }
}


async function updateIndent(req, res) {
    const transaction = new sql.Transaction(pool);
    try {
        const indentId = req.params.id;

        if (!indentId) return res.status(400).json({ message: "Indent ID Required" });

        const vendorDetails = req.body.vendorData;  // Direct access
        const itemDetails = req.body;  // Use req.body directly
        const items = req.body.items || [];  // Default to empty array if no items are provided
        const commercialDetails = req.body;  // Handle commercial details
        const projectDetails = req.body.projectData;
        const indentDetails = req.body;
        const selectedProject = req.body.selectedProject || '';
        const selectedVendor = req.body.selectedVendor || '';
        const file = req.file;

        // Log the received body for debugging
        console.log(req.body);

        // Begin transaction
        await transaction.begin();
        const request = new sql.Request(transaction);

        request
            .input('IndentID', sql.Int, indentId)
            .input('ModeOfPurchase', sql.NVarChar, indentDetails.indentMode)
            .input('Purpose', sql.NVarChar, indentDetails.indentPurpose)
            .input('Document', sql.VarBinary, file ? file.buffer : null)
            .input('VendorID', sql.Int, vendorDetails.VendorID)
            .input('TypeOfIndent', sql.NVarChar, itemDetails.indentType)
            .input('QuotationAvailable', sql.Bit, itemDetails.isQuotationAvailable === 'Yes' ? 1 : 0)
            .input('ExtraGST', sql.Decimal(10, 2), parseFloat(commercialDetails.extraGST || 0))
            .input('Price', sql.Decimal(12, 2), parseFloat(commercialDetails.price || 0))
            .input('TypeOfCurrency', sql.NVarChar, commercialDetails.currency)
            .input('PaymentTerms', sql.NVarChar, commercialDetails.payment)
            .input('DeliveryPlace', sql.NVarChar, commercialDetails.deliveryPlace)
            .input('Delivery', sql.NVarChar, commercialDetails.delivery)
            .input('OtherTerms', sql.NVarChar, commercialDetails.otherTerms)
            .input('ProjectNo', sql.NVarChar, projectDetails.ProjectID)
            .input('SubProjectNo', sql.NVarChar, projectDetails.SubProjectNo)
            .input('ProjectRemarks', sql.NVarChar, projectDetails.ProjectRemarks)
            .input('CurrentStage', sql.NVarChar, "Awaiting For Indent Approval");

        await request.query(`
            UPDATE tbl_indents SET
                                   ModeOfPurchase = @ModeOfPurchase,
                                   Purpose = @Purpose,
                                   Document = CASE WHEN @Document IS NOT NULL THEN @Document ELSE Document END,
                                   VendorID = @VendorID,
                                   TypeOfIndent = @TypeOfIndent,
                                   QuotationAvailable = @QuotationAvailable,
                                   ExtraGST = @ExtraGST,
                                   Price = @Price,
                                   TypeOfCurrency = @TypeOfCurrency,
                                   PaymentTerms = @PaymentTerms,
                                   DeliveryPlace = @DeliveryPlace,
                                   Delivery = @Delivery,
                                   OtherTerms = @OtherTerms,
                                   ProjectNo = @ProjectNo,
                                   SubProjectNo = @SubProjectNo,
                                   ProjectRemarks = @ProjectRemarks,
                                   CurrentStage = @CurrentStage
            WHERE IndentID = @IndentID;
        `);

        // Delete items and approvals before inserting updated items
        const deleteItemsRequest = new sql.Request(transaction);
        await deleteItemsRequest
            .input('IndentID', sql.Int, indentId)
            .query('DELETE FROM tbl_items WHERE IndentID = @IndentID');

        const deleteApprovalRequest = new sql.Request(transaction);
        await deleteApprovalRequest
            .input('IndentID', sql.Int, indentId)
            .query('DELETE FROM tbl_indent_approvals WHERE IndentID = @IndentID');

        // Insert updated items
        for (const item of items) {
            const itemReq = new sql.Request(transaction);
            await itemReq
                .input('IndentID', sql.Int, indentId)
                .input('ProductName', sql.VarChar(100), item.productName)
                .input('ItemName', sql.VarChar(100), item.name)
                .input('Description', sql.VarChar(500), item.desc)
                .input('ItemClassification', sql.VarChar(50), item.classification)
                .input('Quantity', sql.Decimal(10, 2), parseFloat(item.qty || 0))
                .input('Unit', sql.VarChar(20), item.unit)
                .input('EstimatedUnitPrice', sql.Decimal(12, 2), parseFloat(item.price || 0))
                .input('EstimatedTotalPrice', sql.Decimal(12, 2), parseFloat(item.estTotalPrice || 0))
                .input('Remarks', sql.VarChar(500), item.remarks || null)
                .query(`
                    INSERT INTO tbl_items (
                        IndentID, ProductName, ItemName, Description, ItemClassification,
                        Quantity, Unit, EstimatedUnitPrice, EstimatedTotalPrice, Remarks
                    ) VALUES (
                                 @IndentID, @ProductName, @ItemName, @Description, @ItemClassification,
                                 @Quantity, @Unit, @EstimatedUnitPrice, @EstimatedTotalPrice, @Remarks
                             );
                `);
        }

        // Commit transaction
        await transaction.commit();

        console.log('Indent and items updated successfully');
        return res.status(200).json({ message: 'Indent updated successfully' });
    } catch (err) {
        console.error('Error during updateIndent:', err);
        await transaction.rollback();
        return res.status(500).json({
            message: err.message || 'Internal Server Error',
        });
    }
}

async function getWaitingDaysForIndents(req,res){
    try{
        let request=await pool.request();
        let query=`
        
            SELECT
    i.IndentID,
    i.CreatedAt,


    CASE
        WHEN f.VerifiedAt IS NOT NULL THEN DATEDIFF(DAY, i.CreatedAt, f.VerifiedAt)
        WHEN f.VerifiedAt IS NULL THEN DATEDIFF(DAY, i.CreatedAt, GETDATE())
        END AS FundCheck,


    CASE
        WHEN f.VerifiedAt IS NOT NULL AND l.ProcessedAt IS NOT NULL THEN DATEDIFF(DAY, f.VerifiedAt, l.ProcessedAt)
        WHEN f.VerifiedAt IS NOT NULL AND l.ProcessedAt IS NULL THEN DATEDIFF(DAY, f.VerifiedAt, GETDATE())
        END AS LPC,


    CASE
        WHEN l.ProcessedAt IS NOT NULL AND ia.ActionAt IS NOT NULL THEN DATEDIFF(DAY, l.ProcessedAt, ia.ActionAt)
        WHEN l.ProcessedAt IS NOT NULL AND ia.ActionAt IS NULL THEN DATEDIFF(DAY, l.ProcessedAt, GETDATE())
        END AS IndentApproval,


    CASE
        WHEN ia.ActionAt IS NOT NULL AND pa.ApprovalDate IS NOT NULL THEN DATEDIFF(DAY, ia.ActionAt, pa.ApprovalDate)
        WHEN ia.ActionAt IS NOT NULL AND pa.ApprovalDate IS NULL THEN DATEDIFF(DAY, ia.ActionAt, GETDATE())
        END AS POApproval,


    CASE
        WHEN pa.ApprovalDate IS NOT NULL AND tpg.GeneratedAt IS NOT NULL THEN DATEDIFF(DAY, pa.ApprovalDate, tpg.GeneratedAt)
        WHEN pa.ApprovalDate IS NOT NULL AND tpg.GeneratedAt IS NULL THEN DATEDIFF(DAY, pa.ApprovalDate, GETDATE())
        END AS POGeneration,


    CASE
        WHEN tpg.GeneratedAt IS NOT NULL AND srb.CreatedAt IS NOT NULL THEN DATEDIFF(DAY, tpg.GeneratedAt, srb.CreatedAt)
        WHEN tpg.GeneratedAt IS NOT NULL AND srb.CreatedAt IS NULL THEN DATEDIFF(DAY, tpg.GeneratedAt, GETDATE())
        END AS SRB,


    CASE
        WHEN srb.CreatedAt IS NOT NULL AND tbl_icsr_submission.ApprovalDate IS NOT NULL THEN DATEDIFF(DAY, srb.CreatedAt, tbl_icsr_submission.ApprovalDate)
        WHEN srb.CreatedAt IS NOT NULL AND tbl_icsr_submission.ApprovalDate IS NULL THEN DATEDIFF(DAY, srb.CreatedAt, GETDATE())
        WHEN srb.CreatedAt IS NOT NULL AND tbl_icsr_submission.Status = 'Rejected' THEN DATEDIFF(DAY, srb.CreatedAt, tbl_icsr_submission.RejectionDate)
        END AS ICSR

FROM tbl_indents i
         LEFT JOIN tbl_fund_check f ON f.IndentID = i.IndentID
         LEFT JOIN tbl_lpc_processing l ON i.IndentID = l.IndentID
         LEFT JOIN tbl_indent_approvals ia ON i.IndentID = ia.IndentID
         LEFT JOIN tbl_po_approval pa ON i.IndentID = pa.IndentID
         LEFT JOIN tbl_po_generation tpg ON i.IndentID = tpg.IndentID
         LEFT JOIN tbl_srb srb ON i.IndentID = srb.IndentID
         LEFT JOIN tbl_icsr_submission ON i.IndentID = tbl_icsr_submission.IndentID


WHERE tbl_icsr_submission.ApprovalDate IS NULL
  AND tbl_icsr_submission.RejectionDate IS NULL


GROUP BY
    i.IndentID,
    i.CreatedAt,
    f.VerifiedAt,
    l.ProcessedAt,
    ia.ActionAt,
    pa.ApprovalDate,
    tpg.GeneratedAt,
    srb.CreatedAt,
    tbl_icsr_submission.ApprovalDate,
    tbl_icsr_submission.RejectionDate,
    tbl_icsr_submission.Status;

        
        ;`


        let result=await request.query(query);
        return res.status(200).send(result.recordset||[]);
    }catch(err){
        return res.status(500).json({message:err.message||"Internal Server Error"});
    }
}

module.exports={createIndent,getBasicIndentDetails,getIndentById,downloadDocument,updateIndent,findOne,getTest,getWaitingDaysForIndents};