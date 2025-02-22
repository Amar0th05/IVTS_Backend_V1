const {sql,getPool} = require('../config/dbconfig');



let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

async function getAllStaffDetails(req, res){
    try{
        const request= pool.request();

        const query=`
            SELECT
                s.staff_id               AS staffID,
                s.staff_name             AS staffName,
                o.organisation_name      AS locationOfWork,
                s.date_of_joining        AS dateOfJoining,
                s.[status]               AS [status],
                cl.gross_pay             AS currentSalary,
                d.designation            AS currentDesignation
                FROM tbl_staff s
                LEFT JOIN mmt_organisation o
                ON s.location_of_work = o.org_id
                LEFT JOIN mmt_highest_qualification hq
                ON s.highest_qualification = hq.qual_id
                LEFT JOIN mmt_courses c
                ON s.courses = c.course_id
                OUTER APPLY (
                    SELECT TOP 1 cl1.*
                    FROM tbl_contract_logs cl1
                    WHERE cl1.emp_id = s.staff_id
                    ORDER BY cl1.contract_start_date DESC
                ) cl
                LEFT JOIN mmt_designation d
                ON cl.current_designation = d.des_id;

        `;

        const result =await request.query(query);

        if(result.recordset.length>0){
            return res.json({staffDetails:result.recordset});
        }else{
            return res.status(404).json({message:'no records found'});
        }

    }catch(err){
        console.error('error fetching staff details : ',err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getStaffById(req, res){

    const id= req.params.id;

    if(!id){
        return res.status(404).json({message:'no id found'});
    }
    console.log(id);

    try{
        const request= await pool.request();

        await request.input('id',sql.NVarChar(20),id);

        const query=`
            SELECT s.staff_id               AS staffID,
                   s.staff_name             AS staffName,
                   s.date_of_birth          AS dateOfBirth,
                   s.aadhaar_number         AS aadharNumber,
                   s.contact_number         AS contactNumber,
                   s.email_id               AS mail,
                   s.permanent_address      AS permanentAddress,
                   s.salary_at_joining      AS salary,
                   s.qualification          AS qualifications,
                   hq.highest_qualification AS highestQualification,
                   o.organisation_name      AS locationOfWork,
                   s.date_of_joining        AS dateOfJoining,
                   s.certifications         AS certifications,
                   c.course_name            AS courses,
                   s.[status] AS [status]
            FROM tbl_staff s
                LEFT JOIN mmt_organisation o
            ON s.location_of_work = o.org_id
                LEFT JOIN mmt_highest_qualification hq
                ON s.highest_qualification=hq.qual_id
                LEFT JOIN mmt_courses c
                ON s.courses= c.course_id
            WHERE staff_id=@id;
        `;

        const result = await request.query(query);
        if(result.recordset.length>0){
            return res.json({staffDetail:result.recordset[0]});
        }else{
            return res.status(404).json({message:'no records found'});
        }



    }catch(err){
        console.error('error fetching staff details : ',err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function getStaffByIdWithoutJoin(req, res){

    const id= req.params.id;

    if(!id){
        return res.status(404).json({message:'no id found'});
    }
    console.log(id);

    try{
        const request= await pool.request();

        await request.input('id',sql.NVarChar(20),id);

        const query=`
            SELECT staff_id              AS staffID,
                   staff_name            AS staffName,
                   date_of_birth         AS dateOfBirth,
                   aadhaar_number        AS aadharNumber,
                   contact_number        AS contactNumber,
                   email_id              AS mail,
                   permanent_address     AS permanentAddress,
                   salary_at_joining     AS salary,
                   qualification         AS qualifications,
                   highest_qualification AS highestQualification,
                   location_of_work      AS locationOfWork,
                   date_of_joining       AS dateOfJoining,
                   certifications        AS certifications,
                   courses               AS courses, [status] AS [status]
            FROM tbl_staff
            WHERE staff_id=@id;
        `;

        const result = await request.query(query);
        if(result.recordset.length>0){
            return res.json({staffDetail:result.recordset[0]});
        }else{
            return res.status(404).json({message:'no records found'});
        }



    }catch(err){
        console.error('error fetching staff details : ',err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function addStaffDetails(req, res) {
    try {
        const request = pool.request();

        const {data} = req.body;

        if (!data) return res.status(404).json({ message: 'No inputs found' });
        console.log(data);
        if (data.staffID===null) return res.status(404).json({ message: 'No ID found' });
        if (data.locationOfWork===null) return res.status(404).json({ message: 'Location of Work not found' });

        let columns = [];
        let values = [];
        columns.push('staff_id');
        values.push('@id');
        request.input('id', sql.NVarChar(20), data.staffID);

        columns.push("location_of_work");
        values.push("@locationOfWork");
        request.input('locationOfWork', sql.Int, data.locationOfWork);

        if (data.staffName !== undefined) {
            columns.push("staff_name");
            values.push("@name");
            request.input('name', sql.NVarChar(25), data.staffName);
        }

        if (data.dateOfBirth !== undefined) {
            columns.push("date_of_birth");
            values.push("@date_of_birth");
            request.input('date_of_birth', sql.Date, data.dateOfBirth);
        }

        if (data.aadharNumber !== undefined) {
            columns.push("aadhaar_number");
            values.push("@aadharNumber");
            request.input('aadharNumber', sql.Numeric(12, 0), data.aadharNumber);
        }

        if (data.contactNumber !== undefined) {
            columns.push("contact_number");
            values.push("@contactNumber");
            request.input('contactNumber', sql.Numeric(10, 0), data.contactNumber);
        }

        if (data.mail !== undefined) {
            columns.push("email_id");
            values.push("@mail");
            request.input('mail', sql.NVarChar(320), data.mail);
        }

        if (data.permanentAddress !== undefined) {
            columns.push("permanent_address");
            values.push("@permanentAddress");
            request.input('permanentAddress', sql.NVarChar(255), data.permanentAddress);
        }

        if (data.dateOfJoining !== undefined) {
            columns.push("date_of_joining");
            values.push("@dateofJoining");
            request.input('dateofJoining', sql.Date, data.dateOfJoining);
        }

        if (data.salary !== undefined) {
            columns.push("salary_at_joining");
            values.push("@salary");
            request.input('salary', sql.Decimal(10, 2), data.salary);
        }

        if (data.qualifications !== undefined) {
            columns.push("qualification");
            values.push("@qualifications");
            request.input('qualifications', sql.NVarChar(100), data.qualifications);
        }

        if (data.highestQualification !== undefined) {
            columns.push("highest_qualification");
            values.push("@highestQualification");
            request.input('highestQualification', sql.Int, data.highestQualification);
        }

        if (data.certifications !== undefined) {
            columns.push("certifications");
            values.push("@certifications");
            request.input('certifications', sql.NVarChar(255), data.certifications);
        }

        if (data.courses !== undefined) {
            columns.push("courses");
            values.push("@courses");
            request.input('courses', sql.Int, data.courses);
        }

        columns.push("status");
        values.push("@status");
        request.input('status', sql.Bit, 1);

        const query = `INSERT INTO tbl_staff (${columns.join(", ")}) VALUES (${values.join(", ")})`;

        await request.query(query);

        res.json({ message: "Staff details inserted successfully" });
    } catch (err) {
        console.error("Error inserting staff details:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function updateStaffDetails(req, res) {
    try {
        const request = pool.request();
        const { data } = req.body;

        if (!data) return res.status(400).json({ message: 'No inputs found' });
        if (!data.staffID) return res.status(400).json({ message: 'No ID found' });

        request.input('id', sql.NVarChar(20), data.staffID);

        let updates = [];

        if (data.staffName !== undefined) {
            updates.push("staff_name = @name");
            request.input('name', sql.NVarChar(25), data.staffName);
        }

        if (data.locationOfWork !== undefined) {
            updates.push("location_of_work = @locationOfWork");
            request.input('locationOfWork', sql.Int, data.locationOfWork);
        }

        if (data.dateOfBirth !== undefined) {
            updates.push("date_of_birth = @date_of_birth");
            request.input('date_of_birth', sql.Date, data.dateOfBirth);
        }

        if (data.aadharNumber !== undefined) {
            updates.push("aadhaar_number = @aadharNumber");
            request.input('aadharNumber', sql.Numeric(12, 0), data.aadharNumber);
        }

        if (data.contactNumber !== undefined) {
            updates.push("contact_number = @contactNumber");
            request.input('contactNumber', sql.Numeric(10, 0), data.contactNumber);
        }

        if (data.mail !== undefined) {
            updates.push("email_id = @mail");
            request.input('mail', sql.NVarChar(320), data.mail);
        }

        if (data.permanentAddress !== undefined) {
            updates.push("permanent_address = @permanentAddress");
            request.input('permanentAddress', sql.NVarChar(255), data.permanentAddress);
        }

        if (data.dateOfJoining !== undefined) {
            updates.push("date_of_joining = @dateofJoining");
            request.input('dateofJoining', sql.Date, data.dateOfJoining);
        }

        if (data.salary !== undefined) {
            updates.push("salary_at_joining = @salary");
            request.input('salary', sql.Decimal(10, 2), data.salary);
        }

        if (data.qualifications !== undefined) {
            updates.push("qualification = @qualifications");
            request.input('qualifications', sql.NVarChar(100), data.qualifications);
        }

        if (data.highestQualification !== undefined) {
            updates.push("highest_qualification = @highestQualification");
            request.input('highestQualification', sql.Int, data.highestQualification);
        }

        if (data.certifications !== undefined) {
            updates.push("certifications = @certifications");
            request.input('certifications', sql.NVarChar(255), data.certifications);
        }

        if (data.courses !== undefined) {
            updates.push("courses = @courses");
            request.input('courses', sql.Int, data.courses);
        }

        updates.push("status = @status");
        request.input('status', sql.Bit, 1);

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        const query = `UPDATE tbl_staff SET ${updates.join(", ")} WHERE staff_id = @id`;

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Staff ID not found" });
        }

        return res.json({ message: "Staff details updated successfully" });
    } catch (err) {
        console.error("Error updating staff details:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}



async function toggleStaffStatus(req, res) {
    try {
        const {id}= req.params;
        const request = await pool.request();

        console.log(id);
        request.input("staff_id", sql.NVarChar(20), id);

        const result = await request.query(`
            UPDATE tbl_staff
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE staff_id = @staff_id
        `);

        if (result.rowsAffected[0] > 0) {
            res.json({ message: "Status toggled successfully" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        console.error("Error toggling staff status:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getActiveStaff(req, res) {
    try {
        const pool = await getPool(req);

        const query = `SELECT staff_id, staff_name FROM tbl_staff WHERE status = 1;`;
        const result = await pool.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ staffs: result.recordset });
        } else {
            return res.status(404).json({ error: "No active staff found" });
        }
    } catch (error) {
        console.error("Error fetching active staff:", error);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


module.exports={
    getAllStaffDetails,
    getUserById: getStaffById,
    addStaffDetails,
    toggleStaffStatus,
    getUserByIdWithoutJoin: getStaffByIdWithoutJoin,
    updateStaffDetails,
    getActiveStaff
}