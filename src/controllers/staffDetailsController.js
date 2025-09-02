const {sql,getPool} = require('../config/dbconfig');
const { uploadInvoice } = require('./o&mInvoiceController');



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

async function downloadAllStaffDetails(req, res){
    try{
        const request= pool.request();

        const query=`
            SELECT
                s.staff_id               AS staffID,
                s.staff_name             AS staffName,
                o.organisation_name      AS locationOfWork,
                s.date_of_joining        AS dateOfJoining,
                s.salary_at_joining AS salaryAtJoining,
                s.date_of_birth AS dateOfBirth,
                s.aadhaar_number AS aadharNumber,
                s.permanent_address AS permanentAddress,
                s.contact_number AS contactNumber,
                s.email_id AS email,
                hq.highest_qualification as highestQualification,
                s.qualification as qualification,
                s.certifications,
                c.course_name as course,
                cl.gross_pay             AS currentSalary,
                d.designation            AS currentDesignation,
                s.[status]               AS [status]
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
    // console.log(id);

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

async function getStaffByIdWithoutJoin(req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(404).json({ message: 'no id found' });
    }
    // console.log(id);

    try {
        const request = await pool.request();
        await request.input('id', sql.NVarChar(20), id);

        // Query for staff details
        const query = `
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
                   courses               AS courses,
                [status]              AS [status]
            FROM tbl_staff
            WHERE staff_id=@id;
        `;

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'no records found' });
        }

        // Query for insurance details
        const insuranceQuery = `
            SELECT id                     AS insuranceID,
                   emp_id                 AS empID,
                   insurance_provider     AS insuranceProvider,
                   policy_number          AS policyNumber,
                   policy_start_date      AS policyStartDate,
                   policy_expiry_date     AS policyExpiryDate,
                   insurance_updated      AS insuranceUpdated,
                   updated_by             AS updatedBy
            FROM tbl_employee_insurance
            WHERE emp_id=@id;
        `;

        const insuranceResult = await request.query(insuranceQuery);
        // console.log('insurance details : ',insuranceResult.recordset.length > 0 ? insuranceResult.recordset : null);
        return res.json({
            staffDetail: result.recordset[0],

            insuranceDetail: insuranceResult.recordset.length > 0 ? insuranceResult.recordset : null
        });

    } catch (err) {
        console.error('error fetching staff details : ', err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}




// async function addStaffDetails(req, res) {
//     try {
//         const request = pool.request();
//         const { data } = req.body;
//         const {insuranceData}=req.body;
//         const {documentData}=req.body;


//         if (!data) return res.status(404).json({ message: 'No inputs found' });
//         if (data.staffID === null) return res.status(404).json({ message: 'No ID found' });
//         if (data.locationOfWork === null) return res.status(404).json({ message: 'Location of Work not found' });

//         let columns = ['staff_id', 'location_of_work'];
//         let values = ['@id', '@locationOfWork'];
//         request.input('id', sql.NVarChar(20), data.staffID);
//         request.input('locationOfWork', sql.Int, data.locationOfWork);

//         if (data.staffName !== undefined) {
//             columns.push("staff_name");
//             values.push("@name");
//             request.input('name', sql.NVarChar(25), data.staffName);
//         }

//         if (data.dateOfBirth !== undefined) {
//             columns.push("date_of_birth");
//             values.push("@date_of_birth");
//             request.input('date_of_birth', sql.Date, data.dateOfBirth);
//         }

//         if (data.aadharNumber !== undefined) {
//             columns.push("aadhaar_number");
//             values.push("@aadharNumber");
//             request.input('aadharNumber', sql.Numeric(12, 0), data.aadharNumber);
//         }

//         if (data.contactNumber !== undefined) {
//             columns.push("contact_number");
//             values.push("@contactNumber");
//             request.input('contactNumber', sql.Numeric(10, 0), data.contactNumber);
//         }

//         if (data.mail !== undefined) {
//             columns.push("email_id");
//             values.push("@mail");
//             request.input('mail', sql.NVarChar(320), data.mail);
//         }

//         if (data.permanentAddress !== undefined) {
//             columns.push("permanent_address");
//             values.push("@permanentAddress");
//             request.input('permanentAddress', sql.NVarChar(255), data.permanentAddress);
//         }

//         if (data.dateOfJoining !== undefined) {
//             columns.push("date_of_joining");
//             values.push("@dateofJoining");
//             request.input('dateofJoining', sql.Date, data.dateOfJoining);
//         }

//         if (data.salary !== undefined) {
//             columns.push("salary_at_joining");
//             values.push("@salary");
//             request.input('salary', sql.Decimal(10, 2), data.salary);
//         }

//         if (data.qualifications !== undefined) {
//             columns.push("qualification");
//             values.push("@qualifications");
//             request.input('qualifications', sql.NVarChar(100), data.qualifications);
//         }

//         if (data.highestQualification !== undefined) {
//             columns.push("highest_qualification");
//             values.push("@highestQualification");
//             request.input('highestQualification', sql.Int, data.highestQualification);
//         }

//         if (data.certifications !== undefined) {
//             columns.push("certifications");
//             values.push("@certifications");
//             request.input('certifications', sql.NVarChar(255), data.certifications);
//         }

//         if (data.courses !== undefined) {
//             columns.push("courses");
//             values.push("@courses");
//             request.input('courses', sql.Int, data.courses);
//         }

//         columns.push("status");
//         values.push("@status");
//         request.input('status', sql.Bit, 1);

//         const staffQuery = `INSERT INTO tbl_staff (${columns.join(", ")}) VALUES (${values.join(", ")})`;
//         await request.query(staffQuery);


//         if (insuranceData) {
//             const insuranceRequest = pool.request();
//             const { insuranceProvider, policyNumber, policyStartDate, policyExpiryDate,updatedBy } = insuranceData;

//             if(insuranceProvider && policyNumber && policyStartDate && updatedBy && policyExpiryDate) {
//                 insuranceRequest.input('emp_id', sql.NVarChar(20), data.staffID);
//                 insuranceRequest.input('insurance_provider', sql.NVarChar(255), insuranceProvider||null);
//                 insuranceRequest.input('policy_number', sql.NVarChar(100), policyNumber||null);
//                 insuranceRequest.input('policy_start_date', sql.Date, policyStartDate||null);
//                 insuranceRequest.input('policy_expiry_date', sql.Date, policyExpiryDate||null);
//                 insuranceRequest.input('insurance_updated', sql.Bit, 0);
//                 insuranceRequest.input('updated_by',sql.NVarChar,updatedBy||null);

//                 const insuranceQuery = `INSERT INTO tbl_employee_insurance (emp_id, insurance_provider, policy_number, policy_start_date, policy_expiry_date, insurance_updated) 
//                                     VALUES (@emp_id, @insurance_provider, @policy_number, @policy_start_date, @policy_expiry_date, @insurance_updated)`;

//                 await insuranceRequest.query(insuranceQuery);
//             }

//         }

//         if(documentData){
//             const documentRequest=pool.request();
//             const {aadhaarFile,panFile,academicFile,idCardFile,certFile10,certFile12,certFileGMDSS,certFileIALA}=documentData;
//             documentRequest.input('staff_id',sql.NVARCHAR(20),data.staffID);
//             documentRequest.input('aadhaarFile',sql.NVarChar(255),aadhaarFile.buffer||null);
//             documentRequest.input('panFile',sql.NVarChar(255),panFile.buffer||null);
//             documentRequest.input('academicFile',sql.NVarChar(255),academicFile?academicFile.buffer||null);
//             documentRequest.input('idCardFile',sql.NVarChar(255),idCardFile?idCardFile.buffer||null);
//             documentRequest.input('certFile10',sql.NVarChar(255),certFile10?certFile10.buffer||null);
//             documentRequest.input('certFile12',sql.NVarChar(255),certFile12?certFile12.buffer||null);
//             documentRequest.input('certFileGMDSS',sql.NVarChar(255),certFileGMDSS?certFileGMDSS.buffer||null);
//             documentRequest.input('certFileIALA',sql.NVarChar(255),certFileIALA?certFileIALA.buffer||null);
//         }

//         res.json({ message: "Staff details and insurance inserted successfully" });
//     } catch (err) {
//         console.error("Error inserting staff or insurance details:", err);
//         res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
//     }
// }


async function addStaffDetails(req, res) {
  try {
    console.log("Adding staff details with data:", req.body);
    console.log("Files received:", req.files);

    // Parse data and insuranceData from req.body
    let data, insuranceData;
    try {
      data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
      insuranceData = typeof req.body.insuranceData === "string" ? JSON.parse(req.body.insuranceData) : req.body.insuranceData;
    } catch {
      return res.status(400).json({ message: "Invalid JSON format in request body" });
    }

    if (!data || !data.staffID) {
      return res.status(400).json({ message: "Missing staff data or staffID" });
    }

    // Insert into tbl_staff
    const request = pool.request();
    request.input("id", sql.NVarChar(20), data.staffID);
    request.input("locationOfWork", sql.Int, data.locationOfWork);

    const columns = ["staff_id", "location_of_work"];
    const values = ["@id", "@locationOfWork"];

    // Helper to add dynamic fields
    const addField = (fieldName, sqlType, value) => {
      if (value !== undefined && value !== null) {
        const param = fieldName.replace(/[^a-zA-Z]/g, '');
        request.input(param, sqlType, value);
        columns.push(fieldName);
        values.push("@" + param);
      }
    };

    addField("staff_name", sql.NVarChar(25), data.staffName);
    addField("date_of_birth", sql.Date, data.dateOfBirth);
    addField("aadhaar_number", sql.Numeric(12, 0), data.aadharNumber);
    addField("contact_number", sql.Numeric(10, 0), data.contactNumber);
    addField("email_id", sql.NVarChar(320), data.mail);
    addField("permanent_address", sql.NVarChar(255), data.permanentAddress);
    addField("date_of_joining", sql.Date, data.dateOfJoining);
    addField("salary_at_joining", sql.Decimal(10, 2), data.salary);
    addField("qualification", sql.NVarChar(100), data.qualifications);
    addField("highest_qualification", sql.Int, data.highestQualification);
    addField("certifications", sql.NVarChar(255), data.certifications);
    addField("courses", sql.Int, data.courses);
    addField("status", sql.Bit, 1);

    const staffQuery = `INSERT INTO tbl_staff (${columns.join(", ")}) VALUES (${values.join(", ")})`;
    await request.query(staffQuery);

    // Insert insurance data if present
    if (insuranceData) {
      const { insuranceProvider, policyNumber, policyStartDate, policyExpiryDate, updatedBy } = insuranceData;
      if (insuranceProvider && policyNumber && policyStartDate && policyExpiryDate) {
        const insuranceRequest = pool.request();
        insuranceRequest.input("emp_id", sql.NVarChar(20), data.staffID);
        insuranceRequest.input("insurance_provider", sql.NVarChar(255), insuranceProvider);
        insuranceRequest.input("policy_number", sql.NVarChar(100), policyNumber);
        insuranceRequest.input("policy_start_date", sql.Date, policyStartDate);
        insuranceRequest.input("policy_expiry_date", sql.Date, policyExpiryDate);
        insuranceRequest.input("insurance_updated", sql.Bit, 0);
        insuranceRequest.input("updated_by", sql.NVarChar, updatedBy || null);

        await insuranceRequest.query(`
          INSERT INTO tbl_employee_insurance (
            emp_id, insurance_provider, policy_number,
            policy_start_date, policy_expiry_date, insurance_updated, updated_by
          ) VALUES (
            @emp_id, @insurance_provider, @policy_number,
            @policy_start_date, @policy_expiry_date, @insurance_updated, @updated_by
          )
        `);
      }
    }

    // Organize uploaded files - assumes req.files is an array (multer.any)
    const files = {};
    if (Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (!files[file.fieldname]) files[file.fieldname] = [];
        files[file.fieldname].push(file);
      });
    } else {
      // If multer.fields used, req.files is already an object of arrays
      Object.assign(files, req.files);
    }

    // Insert into StaffDocuments
    const documentRequest = pool.request();
    documentRequest.input("staff_id", sql.NVarChar(20), data.staffID);

    const fileFields = [
      "aadhaarFile", "panFile", "academicFile", "idCardFile",
      "certFile10", "certFile12", "certFileGMDSS", "certFileIALA"
    ];

    for (let field of fileFields) {
      const file = files[field]?.[0] || null; // first file or null
      documentRequest.input(field, sql.VarBinary(sql.MAX), file ? file.buffer : null);
    }

    await documentRequest.query(`
      INSERT INTO dbo.StaffDocuments (
        StaffID, AadhaarFile, PANFile, AcademicCertificateFile, IDCardFile,
        TenthCertificateFile, TwelfthCertificateFile, GMDSSCertificateFile, IALACertificateFile
      ) VALUES (
        @staff_id, @aadhaarFile, @panFile, @academicFile, @idCardFile,
        @certFile10, @certFile12, @certFileGMDSS, @certFileIALA
      )
    `);

    // Insert other certificates
    const filess = req.files;
    const otherCertFiles = filess['otherCertFile'] || [];
    const otherCertNames = Array.isArray(req.body['otherCertName'])
      ? req.body['otherCertName']
      : [req.body['otherCertName']];

    for (let i = 0; i < otherCertFiles.length; i++) {
      const certFile = otherCertFiles[i];
      const certName = otherCertNames[i] || 'Unnamed Certificate';

      const certReq = pool.request();
      certReq.input('staff_id', sql.NVarChar(20), req.body.staffID); // or however you're passing it
      certReq.input('certificate_name', sql.NVarChar(255), certName);
      certReq.input('certificate_file', sql.VarBinary(sql.MAX), certFile.buffer);

      await certReq.query(`
        INSERT INTO dbo.OtherCertificates (StaffID, CertificateName, CertificateFile)
        VALUES (@staff_id, @certificate_name, @certificate_file)
      `);
    }


    res.json({ message: "Staff details, insurance, and documents inserted successfully" });
  } catch (err) {
    console.error("Error inserting staff or insurance details:", err);
    res.status(500).json({ message: err?.message || "Internal Server Error" });
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

        // console.log(id);
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



// uplode document

async function getMetadata(req, res){
    console.log("Fetching document metadata...")
  const staffId = req.params.id;
  console.log("Staff ID:", staffId);

  try {
    // Connect to the database
     const request= pool.request();

    // Query presence of each document column (1 = present, 0 = null)
    const query = `
      SELECT
        CASE WHEN AadhaarFile IS NOT NULL THEN 1 ELSE 0 END AS hasAadhaar,
        CASE WHEN PANFile IS NOT NULL THEN 1 ELSE 0 END AS hasPAN,
        CASE WHEN AcademicCertificateFile IS NOT NULL THEN 1 ELSE 0 END AS hasAcademicCertificate,
        CASE WHEN IDCardFile IS NOT NULL THEN 1 ELSE 0 END AS hasIDCard,
        CASE WHEN TenthCertificateFile IS NOT NULL THEN 1 ELSE 0 END AS hasTenthCertificate,
        CASE WHEN TwelfthCertificateFile IS NOT NULL THEN 1 ELSE 0 END AS hasTwelfthCertificate,
        CASE WHEN GMDSSCertificateFile IS NOT NULL THEN 1 ELSE 0 END AS hasGMDSSCertificate,
        CASE WHEN IALACertificateFile IS NOT NULL THEN 1 ELSE 0 END AS hasIALACertificate
      FROM dbo.StaffDocuments
      WHERE StaffID = @staffId
    `;
    request.input('staffId', sql.NVarChar, staffId);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      // No documents row found for this staff, respond with all false
      const metadata = [
        { name: "AadhaarFile", exists: false },
        { name: "PANFile", exists: false },
        { name: "AcademicCertificateFile", exists: false },
        { name: "IDCardFile", exists: false },
        { name: "TenthCertificateFile", exists: false },
        { name: "TwelfthCertificateFile", exists: false },
        { name: "GMDSSCertificateFile", exists: false },
        { name: "IALACertificateFile", exists: false },
      ];
      return res.json(metadata);
    }

    const row = result.recordset[0];

    // Build metadata array expected by frontend
    const metadata = [
      { name: "AadhaarFile", exists: row.hasAadhaar === 1},
      { name: "PANFile", exists: row.hasPAN === 1 },
      { name: "AcademicCertificateFile", exists: row.hasAcademicCertificate === 1 },
      { name: "IDCardFile", exists: row.hasIDCard === 1 },
      { name: "TenthCertificateFile", exists: row.hasTenthCertificate === 1 },
      { name: "TwelfthCertificateFile", exists: row.hasTwelfthCertificate === 1 },
      { name: "GMDSSCertificateFile", exists: row.hasGMDSSCertificate === 1 },
      { name: "IALACertificateFile", exists: row.hasIALACertificate === 1 },
    ];

    res.json(metadata);
  } catch (error) {
    console.error("Error fetching document metadata:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Map docName to actual column in DB
const documentColumnMap = {
  AadhaarFile: "AadhaarFile",
  PANFile: "PANFile",
  AcademicCertificateFile: "AcademicCertificateFile",
  IDCardFile: "IDCardFile",
  TenthCertificateFile: "TenthCertificateFile",
  TwelfthCertificateFile: "TwelfthCertificateFile",
  GMDSSCertificateFile: "GMDSSCertificateFile",
  IALACertificateFile: "IALACertificateFile"
};

async function downloadDocument(req, res) {
  const { staffId, docName } = req.params;

  if (!documentColumnMap[docName]) {
    return res.status(400).json({ error: "Invalid document name" });
  }

  try {
    const request = pool.request();

    const column = documentColumnMap[docName];

    const query = `
      SELECT ${column} AS DocumentData
      FROM dbo.StaffDocuments
      WHERE StaffID = @staffId
    `;

    request.input('staffId', sql.NVarChar, staffId);

    const result = await request.query(query);

    if (result.recordset.length === 0 || !result.recordset[0].DocumentData) {
      return res.status(404).json({ error: "Document not found" });
    }

    const fileBuffer = result.recordset[0].DocumentData;

    // Set headers for PDF file download
    res.setHeader('Content-Disposition', `attachment; filename=${docName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Send the PDF binary data as the response
    res.send(fileBuffer);

  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// delete 
const allowedColumns = ['AadhaarFile','PANFile','AcademicCertificateFile','IDCardFile','TenthCertificateFile','TwelfthCertificateFile','GMDSSCertificateFile','IALACertificateFile'];
async function deleteDocument(req, res) {
  const { staffId, docName } = req.params;

  if (!allowedColumns.includes(docName)) {
    return res.status(400).json({ error: 'Invalid document name' });
  }

  try {
    const request = pool.request();

    // Build query with the validated column name (no parameterization for column)
    const query = `UPDATE dbo.StaffDocuments SET ${docName} = NULL WHERE StaffID = @staffId`;

    const result = await request
      .input('staffId', sql.NVarChar, staffId)
      .query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: `Document ${docName} cleared for staff ${staffId}` });
    } else {
      res.status(404).json({ message: `Staff ${staffId} not found` });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// uploade
const allowedDocColumns = [
  'AadhaarFile', 'PANFile', 'AcademicCertificateFile', 'IDCardFile',
  'TenthCertificateFile', 'TwelfthCertificateFile', 'GMDSSCertificateFile', 'IALACertificateFile'
];

async function uploadDocument(req,res){
  const { staffId, docName } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  if (!allowedDocColumns.includes(docName)) {
    return res.status(400).json({ message: 'Invalid document name' });
  }

  try {
    const request = pool.request();

    // Input parameters
    request.input('staffId', sql.NVarChar, staffId);
    request.input('fileData', sql.VarBinary(sql.MAX), req.file.buffer);

    // Dynamic column update query (column name can’t be parameterized)
    const query = `UPDATE dbo.StaffDocuments SET ${docName} = @fileData WHERE StaffID = @staffId`;

    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: `${docName} uploaded successfully for staff ${staffId}` });
    } else {
      res.status(404).json({ message: `Staff ${staffId} not found` });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};










module.exports={
    getAllStaffDetails,
    getUserById: getStaffById,
    addStaffDetails,
    toggleStaffStatus,
    getUserByIdWithoutJoin: getStaffByIdWithoutJoin,
    updateStaffDetails,
    getActiveStaff,
    downloadAllStaffDetails,
    getMetadata,
    downloadDocument,
    deleteDocument,
    uploadDocument
}