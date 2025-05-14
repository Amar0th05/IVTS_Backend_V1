const {sql,getPool} = require('../config/dbconfig');
const {findOne} = require("./indentsController");
// const {sendIndentApprovalAlert} = require("../Utils/IndentMailer");



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

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is Required" });
        }

        if (!data) {
            return res.status(400).json({ message: "No data to insert" });
        }

        if (data.FundAvailable === undefined || data.FundAvailable === '') {
            return res.status(400).json({ message: "Missing required field: FundAvailable" });
        }

        if (data.FundAvailable === false && (!data.AlternateProjectNo || data.AlternateProjectNo === '')) {
            return res.status(400).json({ message: "Missing required field: AlternateProjectNo" });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized: user ID missing" });
        }

        request.input('IndentID', IndentID);
        request.input('FundAvailable', data.FundAvailable);
        request.input('AlternateProjectNo', data.AlternateProjectNo ?? null);
        request.input('Remarks', data.Remarks ?? null);
        request.input('VerifiedBy', req.user.id);

        const query = `
            INSERT INTO tbl_fund_check (IndentID, FundAvailable, AlternateProjectNo, Remarks, VerifiedBy)
            VALUES (@IndentID, @FundAvailable, @AlternateProjectNo, @Remarks, @VerifiedBy);
        `;

        const result = await request.query(query);

        if (data.AlternateProjectNo) {
            await request.query(`
                UPDATE tbl_indents SET ProjectNo = @AlternateProjectNo WHERE IndentID = @IndentID;
            `);
        }

        // let indent=await findOne(IndentID);
        //
        // let mailData={
        //     IndentID:indent.IndentID,
        //     CreatedBy:req.user.name,
        //     items:indent.items,
        //     price:indent.Price,
        //     ProjectNo:indent.ProjectNo,
        //     TypeOfIndent:indent.TypeOfIndent,
        //     indentMode:indent.ModeOfPurchase,
        //     indentPurpose:indent.Purpose,
        //     ExtraGST:indent.ExtraGST,
        //     Price:indent.Price,
        //     Payment:indent.PaymentTerms,
        //     DeliveryPlace:indent.DeliveryPlace,
        //     VendorName:indent.VendorName,
        //     VendorAddress:indent.VendorAddress,
        //     VendorPhone:indent.VendorPhone,
        //     VendorMail:indent.VendorEmail,
        //     VendorGST:indent.VendorGSTNO,
        //     VendorPAN:indent.VendorPANNO,
        //     VendorAccount:indent.VendorAccountNumber,
        //     VendorIFSC:indent.VendorIFSC,
        //     Delivery:indent.Delivery
        // }

        if (result.rowsAffected[0] > 0) {
            // await sendIndentApprovalAlert(mailData);
            return res.status(200).json({ message: "Fund Check Completed" });

        }

        return res.status(500).json({ message: "Something went wrong" });

    } catch (err) {
        console.error("fund check controller:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

async function getRecordById(req, res) {
    try {
        let IndentID = req.params.id;

        if (!IndentID) {
            return res.status(400).json({ message: "Indent ID is Required" });
        }


        let request = await pool.request();
        request.input('IndentID', IndentID);

        let result = await request.query(`
            SELECT FundCheckID, FundAvailable, AlternateProjectNo, Remarks, VerifiedAt, VerifiedBy, u.name as Username
            FROM tbl_fund_check
            LEFT JOIN tbl_user u ON u.id = VerifiedBy
            WHERE IndentID = @IndentID;
        `);


        if (result.recordset.length > 0) {
            return res.status(200).json({ record: result.recordset[0] });
        }

        return res.status(404).json({ message: "Record Not Found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}



module.exports= {createRecord,getRecordById};