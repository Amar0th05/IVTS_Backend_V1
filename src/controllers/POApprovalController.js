const {sql,getPool} = require('../config/dbconfig');
const {Transaction} = require("mssql/lib/base");
const transaction = require("mssql/lib/base/transaction");

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



        if (!IndentID) {
            return res.status(400).send({ message: "Missing Required Field: IndentID" });
        }

        if (!data) {
            return res.status(400).send({ message: "Missing Required Field: Data" });
        }

        console.log(data);
        // return res.status(200).send({message:"Po Approved Successfully"});

        await transaction.begin();
        const request = new sql.Request(transaction);

        request.input("IndentID", IndentID);
        const result = await request.query(`SELECT CurrentStage FROM tbl_indents WHERE IndentID=@IndentID`);
        const currentStage = result.recordset[0]?.CurrentStage;

        if (currentStage !== 'Awaiting For PO Approval') {
            await transaction.rollback();
            return res.status(400).send({ message: "This Indent Is Not Valid For PO Approval" });
        }


        const requiredFields = ['TypeOfOrder', 'Category', 'ReferenceNo', 'ReferenceDate','NameOfWork'];
        for (const field of requiredFields) {
            if (!data[field]) {
                await transaction.rollback();
                return res.status(400).send({ message: `Missing Required Field: ${field}` });
            }
        }


        request.input('TypeOfOrder', data.TypeOfOrder);
        request.input('Category', data.Category);
        request.input('ReferenceNo', data.ReferenceNo);
        request.input('ReferenceDate', data.ReferenceDate);
        request.input('NameOfWork',data.NameOfWork);
        request.input('ApprovedBy', req.user.id);


        if (data.updates) {
            const updatesData = data.updates;
            const updates = [];

            if (updatesData.ExtraGST !== undefined) {
                updates.push("ExtraGST=@ExtraGST");
                request.input('ExtraGST', updatesData.ExtraGST);
            }

            if (updatesData.Price !== undefined) {
                updates.push("Price=@Price");
                request.input('Price', updatesData.Price);
            }

            if (updatesData.Currency !== undefined) {
                updates.push("TypeOfCurrency=@Currency");
                request.input('Currency', updatesData.Currency);
            }

            if (updatesData.Payment !== undefined) {
                updates.push("PaymentTerms=@Payment");
                request.input('Payment', updatesData.Payment);
            }

            if (updatesData.DeliveryPlace !== undefined) {
                updates.push("DeliveryPlace=@DeliveryPlace");
                request.input('DeliveryPlace', updatesData.DeliveryPlace);
            }

            if (updatesData.Delivery !== undefined) {
                updates.push("Delivery=@Delivery");
                request.input('Delivery', updatesData.Delivery);
            }

            if (updates.length > 0) {
                const updateQuery = `UPDATE tbl_indents SET ${updates.join(', ')} WHERE IndentID=@IndentID`;
                const updateResult = await request.query(updateQuery);

                if (updateResult.rowsAffected[0] === 0) {
                    await transaction.rollback();
                    return res.status(500).json({ message: "Error updating tbl_indents" });
                }
            }
        }


        const insertQuery = `
            INSERT INTO tbl_po_approval(IndentID, TypeOfOrder, Category, ReferenceNo, ReferenceDate, ApprovalDate, ApprovedBy,NameOfWork)
            VALUES (@IndentID, @TypeOfOrder, @Category, @ReferenceNo, @ReferenceDate, GETDATE(), @ApprovedBy,@NameOfWork);
        `;

        const insertResult=await request.query(insertQuery);

        if(insertResult.rowsAffected!==0){
            const updateResult = await request.query(`update tbl_indents set CurrentStage='Awaiting For PO Generation', StageUpdatedAt=getdate() where IndentID=@IndentID;`);
            if (updateResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(500).json({ message: "Failed to update indent stage" });
            }

        }

        await transaction.commit();
        return res.status(200).send({ message: "PO Approved Successfully" });

    } catch (err) {
        if (transaction._aborted !== true) await transaction.rollback();
        console.log("PO Approval Controller | Create Record :", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
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

        let query = `
            SELECT
                po.POApprovalID,
                po.TypeOfOrder,
                po.Category,
                po.ReferenceNo,
                po.ReferenceDate,
                po.ApprovalDate,
                po.NameOfWork,
                u.name AS Username,
                po.ApprovedBy
            FROM
                tbl_po_approval po
                    LEFT JOIN
                tbl_user u ON u.id = po.ApprovedBy
            WHERE
                po.IndentID = @IndentID;
        `;

        let result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "PO Approval record not found" });
        }

        return res.status(200).json({ record: result.recordset[0] });
    } catch (err) {
        console.error('Error while fetching PO approval:', err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}


module.exports={createRecord,getRecordById};