const {sql,getPool} = require('../config/dbconfig');



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.log(err);
    }
})();

async function getAllContractDetails(req, res) {
    try {
        const request = pool.request();

        const query = `
            SELECT 
                c.contract_id AS contractID,
                c.emp_id AS staffID,
                c.contract_start_date AS contractStartDate,
                c.contract_end_date AS contractEndDate,
                c.basic_pay AS basicPay,
                c.allowance AS allowance,
                c.gross_pay AS grossPay,
                d.designation AS currentDesignation
            FROM tbl_contract_logs c
            LEFT JOIN mmt_designation d
                ON c.current_designation = d.des_id;
        `;

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.json({ contractDetails: result.recordset });
        } else {
            return res.status(404).json({ message: 'No records found' });
        }

    } catch (err) {
        console.error('Error fetching contract details:', err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getContractById(req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ message: 'No ID provided' });
    }
    console.log(id);

    try {
        const request = await pool.request();
        request.input('id', sql.Int, id);

        const query = `
            SELECT 
                c.contract_id AS contractID,
                c.emp_id AS staffID,
                c.contract_start_date AS contractStartDate,
                c.contract_end_date AS contractEndDate,
                c.basic_pay AS basicPay,
                c.allowance AS allowance,
                c.gross_pay AS grossPay,
                d.designation AS currentDesignation
            FROM tbl_contract_logs c
            LEFT JOIN mmt_designation d
                ON c.current_designation = d.des_id
            WHERE c.contract_id = @id;
        `;

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return res.json({ contractDetail: result.recordset[0] });
        } else {
            return res.status(404).json({ message: 'No records found' });
        }

    } catch (err) {
        console.error('Error fetching contract details:', err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getContractLogById(req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ message: 'No ID provided' });
    }
    console.log(id);

    try {
        const request = await pool.request();
        request.input('id', sql.Int, id);

        const query = `
            SELECT 
                contract_id AS contractID,
                emp_id AS staffID,
                contract_start_date AS contractStartDate,
                contract_end_date AS contractEndDate,
                basic_pay AS basicPay,
                allowance AS allowance,
                gross_pay AS grossPay,
                current_designation AS currentDesignation
            FROM tbl_contract_logs
            WHERE contract_id = @id;
        `;

        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return res.json({ contractLog: result.recordset[0] });
        } else {
            return res.status(404).json({ message: 'No records found' });
        }
    } catch (err) {
        console.error('Error fetching contract logs:', err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function addContractLog(req, res) {
    try {
        const request = pool.request();
        const { data } = req.body;

        console.log(data);

        if (!data) return res.status(400).json({ message: 'No inputs found' });

        let columns = [];
        let values = [];

        // console.log(data);

        if (data.staffID !== undefined) {
            columns.push("emp_id");
            values.push("@staffID");
            request.input("staffID", sql.NVarChar(20), data.staffID);
        }

        if (data.contractStartDate !== undefined) {
            columns.push("contract_start_date");
            values.push("@contractStartDate");
            request.input("contractStartDate", sql.Date, data.contractStartDate);
        }

        if (data.contractEndDate !== undefined) {
            columns.push("contract_end_date");
            values.push("@contractEndDate");
            request.input("contractEndDate", sql.Date, data.contractEndDate);
        }

        if (data.basicPay !== undefined) {
            columns.push("basic_pay");
            values.push("@basicPay");
            request.input("basicPay", sql.Decimal(10, 2), data.basicPay);
        }

        if (data.allowance !== undefined) {
            columns.push("allowance");
            values.push("@allowance");
            request.input("allowance", sql.Decimal(10, 2), data.allowance);
        }

        if (data.basicPay !== undefined && data.allowance !== undefined) {
            const grossPay = parseFloat(data.basicPay) + parseFloat(data.allowance);
            columns.push("gross_pay");
            values.push("@grossPay");
            request.input("grossPay", sql.Decimal(10, 2), grossPay);
        }

        if (data.currentDesignation !== undefined) {
            columns.push("current_designation");
            values.push("@currentDesignation");
            request.input("currentDesignation", sql.Int, data.currentDesignation);
        }

        if (columns.length === 0) {
            return res.status(400).json({ message: 'No fields provided for insertion' });
        }

        const query = `INSERT INTO tbl_contract_logs (${columns.join(", ")}) VALUES (${values.join(", ")})`;

        await request.query(query);

        res.json({ message: "Contract log details inserted successfully" });
    } catch (err) {
        console.error("Error inserting contract log details:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


async function updateContractLogs(req, res) {
    try {
        const request = pool.request();
        const { data } = req.body;

        console.log(data);

        if (!data) return res.status(400).json({ message: 'No inputs found' });
        if (!data.staffID) return res.status(400).json({ message: 'contract id is required' });

        let updates = [];



            updates.push("emp_id = @empID");
            request.input('empID', sql.NVarChar(20), data.staffID);

            request.input('contractID',sql.Int,data.contractID);

        if (data.contractStartDate !== undefined) {
            updates.push("contract_start_date = @contractStartDate");
            request.input('contractStartDate', sql.Date, data.contractStartDate);
        }

        if (data.contractEndDate !== undefined) {
            updates.push("contract_end_date = @contractEndDate");
            request.input('contractEndDate', sql.Date, data.contractEndDate);
        }

        if (data.basicPay !== undefined) {
            updates.push("basic_pay = @basicPay");
            request.input('basicPay', sql.Decimal(10, 2), data.basicPay);
        }

        if (data.allowance !== undefined) {
            updates.push("allowance = @allowance");
            request.input('allowance', sql.Decimal(10, 2), data.allowance);
        }

        if (data.grossPay !== undefined) {
            updates.push("gross_pay = @grossPay");
            request.input('grossPay', sql.Decimal(10, 2), data.grossPay);
        }
        if (data.designation !== undefined) {
            updates.push("current_designation = @currentDesignation");
            request.input('currentDesignation', sql.Int, data.designation);
        }



        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }


        const query = `UPDATE tbl_contract_logs SET ${updates.join(", ")} WHERE contract_id = @contractID`;
        const result = await request.query(query);


        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "No matching records found to update" });
        }

        res.json({ message: "Contract log updated successfully" });
    } catch (err) {
        console.error("Error updating contract logs:", err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}




module.exports={
    getAllContractDetails,
    getContractById,
    updateContractLogs,
    addContractLog,
    getContractLogById
}




