const { sql, getPool } = require('../config/dbconfig');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error('Error while getting pool in employee insurance controller', err);
    }
})();


async function getEmployeeInsurance(req, res) {
    try {
        const employeeId = req.params.id;
        if (!employeeId) return res.status(400).json({ error: "Employee ID is required" });

        const request = await pool.request();
        request.input('employeeId', sql.NVarChar, employeeId);

        const query = `SELECT * FROM tbl_employee_insurance WHERE emp_id = @employeeId;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ policies: result.recordset });
        } else {
            return res.status(404).json({ error: "No policies found" });
        }
    } catch (err) {
        console.error("Error fetching employee insurance:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function checkActivePolicy(req, res) {
    try {
        const employeeId = req.params.id;
        if (!employeeId) return res.status(400).json({ error: "Employee ID is required" });

        const request = await pool.request();
        request.input('employeeId', sql.NVarChar, employeeId);

        const query = `SELECT COUNT(*) AS activePolicy FROM tbl_employee_insurance WHERE emp_id = @employeeId AND policy_expiry_date >= GETDATE();`;
        const result = await request.query(query);

        return res.status(200).json({ hasActivePolicy: result.recordset[0].activePolicy > 0 });
    } catch (err) {
        console.error("Error checking active policy:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function addEmployeeInsurance(req, res) {
    try {
        const { employeeId, policyNumber, provider, policyStartDate, policyEndDate, updatedBy } = req.body;
        console.log(req.body);
        if (!employeeId || !policyNumber || !provider || !policyStartDate || !policyEndDate || !updatedBy) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const request = await pool.request();
        request.input('employeeId', sql.NVarChar, employeeId);

        // Check if the employee already has an active policy
        const checkQuery = `SELECT COUNT(*) AS activePolicy FROM tbl_employee_insurance WHERE emp_id = @employeeId AND policy_expiry_date >= GETDATE();`;
        const checkResult = await request.query(checkQuery);

        if (checkResult.recordset[0].activePolicy > 0) {
            return res.status(400).json({ message: "Employee already has an active insurance policy" });
        }


        request.input('policyNumber', sql.NVarChar, policyNumber);
        request.input('provider', sql.NVarChar, provider);
        request.input('policyStartDate', sql.Date, policyStartDate);
        request.input('policyEndDate', sql.Date, policyEndDate);
        request.input('updatedBy', sql.NVarChar, updatedBy);

        const insertQuery = `
            INSERT INTO tbl_employee_insurance (emp_id, policy_number, insurance_provider, policy_start_date, policy_expiry_date, updated_by)
            VALUES (@employeeId, @policyNumber, @provider, @policyStartDate, @policyEndDate, @updatedBy);
        `;
        await request.query(insertQuery);

        return res.status(201).json({ message: "Insurance policy added successfully" });
    } catch (err) {
        console.error("Error adding employee insurance:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function updateEmployeeInsurance(req, res) {
    try {
        const policyId = req.params.id;
        const { policyNumber, provider, policyStartDate, policyEndDate, updatedBy } = req.body;

        if (!policyId || !policyNumber || !provider || !policyStartDate || !policyEndDate || !updatedBy) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const request = await pool.request();
        request.input('policyId', sql.Int, policyId);
        request.input('policyNumber', sql.NVarChar, policyNumber);
        request.input('provider', sql.NVarChar, provider);
        request.input('policyStartDate', sql.Date, policyStartDate);
        request.input('policyEndDate', sql.Date, policyEndDate);
        request.input('updatedBy', sql.NVarChar, updatedBy);

        const updateQuery = `
            UPDATE tbl_employee_insurance
            SET policy_number = @policyNumber, insurance_provider = @provider, policy_start_date = @policyStartDate, policy_expiry_date = @policyEndDate, updated_by = @updatedBy
            WHERE policy_id = @policyId;
        `;
        const result = await request.query(updateQuery);

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: "Policy not found" });
        }
        return res.json({ message: "Insurance policy updated successfully" });
    } catch (err) {
        console.error("Error updating employee insurance:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function toggleInsuranceStatus(req, res) {
    try {
        const policyId = req.params.id;
        if (!policyId) return res.status(400).json({ message: "Invalid policy ID" });

        const request = await pool.request();
        request.input('policyId', sql.Int, policyId);

        const query = `
            UPDATE tbl_employee_insurance
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE policy_id = @policyId;
        `;
        const result = await request.query(query);

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: "Policy not found" });
        }
        return res.json({ message: "Insurance policy status toggled successfully" });
    } catch (err) {
        console.error("Error toggling policy status:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

module.exports = {
    getEmployeeInsurance,
    checkActivePolicy,
    addEmployeeInsurance,
    updateEmployeeInsurance,
    toggleInsuranceStatus
};
