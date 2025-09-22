const { sql, getPool } = require("../config/dbconfig");
const mailer = require("nodemailer");

// Create transporter (Nodemailer)
const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER, // your email
    pass: process.env.EMAIL_PASSWORD, // app password (not real Gmail password)
  },
});
let pool;

(async () => {
  try {
    pool = await getPool();
  } catch (err) {
    console.error("Error while getting pool in invoice controller", err);
  }
})();

async function createIntern(req, res) {
  console.log("Creating intern:", req.body);

  if (!req.files) {
    return res.status(400).json({ message: "File uploads are missing." });
  }

  try {
    const data = req.body;
    const files = req.files;

    const request = pool.request();
    request.input('FullName', sql.NVarChar, data.fullName);
    request.input('DateOfBirth', sql.Date, data.dob);
    request.input('Gender', sql.NVarChar, data.gender);
    request.input('OtherGender', sql.NVarChar, data.otherGender || null);
    request.input('MobileNumber', sql.VarChar, data.mobile);
    request.input('CurrentLocation', sql.NVarChar, data.location);
    request.input('Email', sql.NVarChar, data.email);
    request.input('PortfolioLink', sql.NVarChar, data.portfolio || null);
    request.input('EmergencyContactName', sql.NVarChar, data.emergencyName);
    request.input('EmergencyContactRelationship', sql.NVarChar, data.relationship);
    request.input('EmergencyContactNumber', sql.VarChar, data.emergencyNumber);
    request.input('CollegeName', sql.NVarChar, data.college);
    request.input('DegreeProgram', sql.NVarChar, data.degree);
    request.input('IsPartOfCurriculum', sql.Bit, data.curriculum === 'yes' ? 1 : 0);
    request.input('FacultySupervisor', sql.NVarChar, data.supervisor || null);
    request.input('PreferredStartDate', sql.Date, data.startDate);
    request.input('PreferredEndDate', sql.Date, data.endDate);
    request.input('InternshipMode', sql.NVarChar, data.mode);
    request.input('HowHeardAboutUs', sql.NVarChar, data.source);

    // File fields (check existence before accessing)
request.input('BonafideFile', sql.VarBinary(sql.MAX), files?.bonafide?.[0]?.buffer || null);
request.input('ResumeFile', sql.VarBinary(sql.MAX), files?.resume?.[0]?.buffer || null);
request.input('PhotoFile', sql.VarBinary(sql.MAX), files?.photo?.[0]?.buffer || null);
request.input('IdProofFile', sql.VarBinary(sql.MAX), files?.idProof?.[0]?.buffer || null);


    await request.query(`
      INSERT INTO dbo.internApplicants (
        FullName, DateOfBirth, Gender, OtherGender, MobileNumber, CurrentLocation, Email, PortfolioLink,
        EmergencyContactName, EmergencyContactRelationship, EmergencyContactNumber,
        CollegeName, DegreeProgram, IsPartOfCurriculum, FacultySupervisor,
        PreferredStartDate, PreferredEndDate, InternshipMode, HowHeardAboutUs,
        BonafideFileData, ResumeFileData, PhotoFileData, IdProofFileData
      ) VALUES (
        @FullName, @DateOfBirth, @Gender, @OtherGender, @MobileNumber, @CurrentLocation, @Email, @PortfolioLink,
        @EmergencyContactName, @EmergencyContactRelationship, @EmergencyContactNumber,
        @CollegeName, @DegreeProgram, @IsPartOfCurriculum, @FacultySupervisor,
        @PreferredStartDate, @PreferredEndDate, @InternshipMode, @HowHeardAboutUs,
        @BonafideFile, @ResumeFile, @PhotoFile, @IdProofFile
      )
    `);

    res.status(201).json({ message: 'Application submitted successfully!' });

  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Failed to submit application.', error: err.message });
  }
}

// get all interns
async function getAllIntern(req, res) {
  try {
    const request = pool.request();

    const query = `
      SELECT 
        [Id], -- add a PK for identifying records
        [FullName],
        [DateOfBirth],
        [Gender],
        [OtherGender],
        [MobileNumber],
        [CurrentLocation],
        [Email],
        [PortfolioLink],
        [EmergencyContactName],
        [EmergencyContactRelationship],
        [EmergencyContactNumber],
        [CollegeName],
        [DegreeProgram],
        [IsPartOfCurriculum],
        [FacultySupervisor],
        [PreferredStartDate],
        [PreferredEndDate],
        [InternshipMode],
        [HowHeardAboutUs],
        [SubmissionDate],
        [status]
        -- do not select VARBINARY here to avoid huge payload
      FROM [IVTS_MANAGEMENT].[dbo].[internApplicants]
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ intern: result.recordset });
    } else {
      return res.status(404).json({ message: "No records found" });
    }
  } catch (err) {
    console.error("Error fetching intern details:", err);
    res.status(500).json({
      message: err.message || "Internal Server Error",
    });
  }
}
//get intern by id
async function getInternById(req, res) {
  const id = req.params.id;
  console.log(id);

  if (!id) {
    return res.status(404).json({ message: `no ${id} found` });
  }

  try {
    const request = await pool.request();

    await request.input("interId", sql.Int, id);

    const query = `
             SELECT 
        [FullName],
        [DateOfBirth],
        [Gender],
        [OtherGender],
        [MobileNumber],
        [CurrentLocation],
        [Email],
        [PortfolioLink],
        [EmergencyContactName],
        [EmergencyContactRelationship],
        [EmergencyContactNumber],
        [CollegeName],
        [DegreeProgram],
        [IsPartOfCurriculum],
        [FacultySupervisor],
        [PreferredStartDate],
        [PreferredEndDate],
        [InternshipMode],
        [HowHeardAboutUs],
        [SubmissionDate]
        -- do not select VARBINARY here to avoid huge payload
      FROM [IVTS_MANAGEMENT].[dbo].[internApplicants]
      WHERE Id = @interId;
    `;

    const result = await request.query(query);
    console.log("result", result);
    if (result.recordset.length > 0) {
      return res.json({ intern: result.recordset[0] });
    } else {
      return res.status(404).json({ message: "no records found" });
    }
  } catch (err) {
    console.error("error fetching staff details : ", err);
    res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}

//update intern

async function updateinternDetails(req, res) {
  try {
    const request = pool.request();
    const { data } = req.body;
    const id = req.params.id;

    console.log("update intern data", data);

    if (!id) return res.status(400).json({ message: "No ID provided" });
    if (!data) return res.status(400).json({ message: "No data provided" });

    request.input("id", sql.Int, id);

    let updates = [];

    if (data.fullName !== undefined) {
      updates.push("FullName = @FullName");
      request.input("FullName", sql.NVarChar(100), data.fullName);
    }

    if (data.dateOfBirth !== undefined) {
      updates.push("DateOfBirth = @DateOfBirth");
      request.input("DateOfBirth", sql.Date, data.dateOfBirth);
    }

    if (data.gender !== undefined) {
      updates.push("Gender = @Gender");
      request.input("Gender", sql.NVarChar(20), data.gender);
    }

    if (data.otherGender !== undefined) {
      updates.push("OtherGender = @OtherGender");
      request.input("OtherGender", sql.NVarChar(50), data.otherGender);
    }

    if (data.mobileNumber !== undefined) {
      updates.push("MobileNumber = @MobileNumber");
      request.input("MobileNumber", sql.NVarChar(15), data.mobileNumber);
    }

    if (data.currentLocation !== undefined) {
      updates.push("CurrentLocation = @CurrentLocation");
      request.input("CurrentLocation", sql.NVarChar(255), data.currentLocation);
    }

    if (data.email !== undefined) {
      updates.push("Email = @Email");
      request.input("Email", sql.NVarChar(320), data.email);
    }

    if (data.portfolioLink !== undefined) {
      updates.push("PortfolioLink = @PortfolioLink");
      request.input("PortfolioLink", sql.NVarChar(255), data.portfolioLink);
    }

    if (data.emergencyContactName !== undefined) {
      updates.push("EmergencyContactName = @EmergencyContactName");
      request.input(
        "EmergencyContactName",
        sql.NVarChar(100),
        data.emergencyContactName
      );
    }

    if (data.emergencyContactRelationship !== undefined) {
      updates.push(
        "EmergencyContactRelationship = @EmergencyContactRelationship"
      );
      request.input(
        "EmergencyContactRelationship",
        sql.NVarChar(50),
        data.emergencyContactRelationship
      );
    }

    if (data.emergencyContactNumber !== undefined) {
      updates.push("EmergencyContactNumber = @EmergencyContactNumber");
      request.input(
        "EmergencyContactNumber",
        sql.NVarChar(15),
        data.emergencyContactNumber
      );
    }

    if (data.collegeName !== undefined) {
      updates.push("CollegeName = @CollegeName");
      request.input("CollegeName", sql.NVarChar(255), data.collegeName);
    }

    if (data.degreeProgram !== undefined) {
      updates.push("DegreeProgram = @DegreeProgram");
      request.input("DegreeProgram", sql.NVarChar(100), data.degreeProgram);
    }
    if (data.isPartOfCurriculum !== undefined) {
      updates.push("IsPartOfCurriculum = @IsPartOfCurriculum");
      request.input(
        "IsPartOfCurriculum",
        sql.Bit,
        data.isPartOfCurriculum.toLowerCase() === "yes" ? 1 : 0
      );
    }

    if (data.facultySupervisor !== undefined) {
      updates.push("FacultySupervisor = @FacultySupervisor");
      request.input(
        "FacultySupervisor",
        sql.NVarChar(100),
        data.facultySupervisor
      );
    }

    if (data.preferredStartDate !== undefined) {
      updates.push("PreferredStartDate = @PreferredStartDate");
      request.input("PreferredStartDate", sql.Date, data.preferredStartDate);
    }

    if (data.preferredEndDate !== undefined) {
      updates.push("PreferredEndDate = @PreferredEndDate");
      request.input("PreferredEndDate", sql.Date, data.preferredEndDate);
    }

    if (data.internshipMode !== undefined) {
      updates.push("InternshipMode = @InternshipMode");
      request.input("InternshipMode", sql.NVarChar(20), data.internshipMode);
    }

    if (data.howHeardAboutUs !== undefined) {
      updates.push("HowHeardAboutUs = @HowHeardAboutUs");
      request.input("HowHeardAboutUs", sql.NVarChar(100), data.howHeardAboutUs);
    }

    if (data.submissionDate !== undefined) {
      updates.push("SubmissionDate = @SubmissionDate");
      request.input("SubmissionDate", sql.Date, data.submissionDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const query = `UPDATE dbo.internApplicants SET ${updates.join(
      ", "
    )} WHERE id = @id`;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Intern ID not found" });
    }

    return res.json({ message: "Intern details updated successfully" });
  } catch (err) {
    console.error("Error updating intern details:", err);
    return res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}

// toggle staff
async function toggleInternStatus(req, res) {
  try {
    const { id } = req.params;
    const request = await pool.request();

    // console.log(id);
    request.input("Id", sql.NVarChar(20), id);

    const result = await request.query(`
            UPDATE dbo.internApplicants
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE id = @Id
        `);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: "Status toggled successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Error toggling staff status:", err);
    res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}

// active status
async function getActiveStaff(req, res) {
  try {
    const pool = await getPool(req);

    const query = `SELECT id, FullName FROM internApplicants WHERE status = 1;`;
    const result = await pool.query(query);

    if (result.recordset.length > 0) {
      return res.status(200).json({ staffs: result.recordset });
    } else {
      return res.status(404).json({ error: "No active staff found" });
    }
  } catch (error) {
    console.error("Error fetching active staff:", error);
    return res.status(500).json({
      message:
        err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}

// uplode document

async function getMetadata(req, res) {
  console.log("Fetching document metadata...");
  const internId = req.params.id;
  console.log("Intern  ID:", internId);

  try {
    // Connect to the database
    const request = pool.request();

    // Query presence of each document column (1 = present, 0 = null)
    const query = `
      SELECT
        CASE WHEN BonafideFileData IS NOT NULL THEN 1 ELSE 0 END AS BonafideFileData,
        CASE WHEN ResumeFileData IS NOT NULL THEN 1 ELSE 0 END AS  ResumeFileData,
        CASE WHEN PhotoFileData IS NOT NULL THEN 1 ELSE 0 END AS PhotoFileData,
        CASE WHEN IdProofFileData IS NOT NULL THEN 1 ELSE 0 END AS IdProofFileData
      FROM dbo.internApplicants
      WHERE Id = @internId
    `;
    request.input("internId", sql.NVarChar, internId);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      // No documents row found for this staff, respond with all false
      const metadata = [
        { name: "BonafideFileData", exists: false },
        { name: "ResumeFileData", exists: false },
        { name: "PhotoFileData", exists: false },
        { name: "IdProofFileData", exists: false },
      ];
      return res.json(metadata);
    }

    const row = result.recordset[0];

    // Build metadata array expected by frontend
    const metadata = [
      { name: "BonafideFileData", exists: row.BonafideFileData === 1 },
      { name: "ResumeFileData", exists: row.ResumeFileData === 1 },
      { name: "PhotoFileData", exists: row.PhotoFileData === 1 },
      { name: "IdProofFileData", exists: row.IdProofFileData === 1 },
    ];

    res.json(metadata);
  } catch (error) {
    console.error("Error fetching document metadata:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Map docName to actual column in DB
const documentColumnMap = {
  BonafideFileData: "BonafideFileData",
  ResumeFileData: "ResumeFileData",
  PhotoFileData: "PhotoFileData",
  IdProofFileData: "IdProofFileData",
};

async function downloadDocument(req, res) {
  const { internId, docName } = req.params;
  console.log("internId", internId);

  if (!documentColumnMap[docName]) {
    return res.status(400).json({ error: "Invalid document name" });
  }

  try {
    const request = pool.request();

    const column = documentColumnMap[docName];

    const query = `
      SELECT ${column} AS DocumentData
      FROM dbo.internApplicants
      WHERE id = @internId
    `;

    request.input("internId", sql.NVarChar, internId);

    const result = await request.query(query);

    if (result.recordset.length === 0 || !result.recordset[0].DocumentData) {
      return res.status(404).json({ error: "Document not found" });
    }

    const fileBuffer = result.recordset[0].DocumentData;

    // Set headers for PDF file download
    res.setHeader("Content-Disposition", `attachment; filename=${docName}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    // Send the PDF binary data as the response
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// delete
const allowedColumns = [
  "BonafideFileData",
  "ResumeFileData",
  "PhotoFileData",
  "IdProofFileData",
];
async function deleteDocument(req, res) {
  const { internId, docName } = req.params;

  if (!allowedColumns.includes(docName)) {
    return res.status(400).json({ error: "Invalid document name" });
  }

  try {
    const request = pool.request();

    // Build query with the validated column name (no parameterization for column)
    const query = `UPDATE dbo.internApplicants SET ${docName} = NULL WHERE id = @internId`;

    const result = await request
      .input("internId", sql.NVarChar, internId)
      .query(query);

    if (result.rowsAffected[0] > 0) {
      res
        .status(200)
        .json({ message: `Document ${docName} cleared for staff ${internId}` });
    } else {
      res.status(404).json({ message: `Staff ${internId} not found` });
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// uploade
const allowedDocColumns = [
  "BonafideFileData",
  "ResumeFileData",
  "PhotoFileData",
  "IdProofFileData",
];

async function uploadDocument(req, res) {
  const { internId, docName } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (!allowedDocColumns.includes(docName)) {
    return res.status(400).json({ message: "Invalid document name" });
  }

  try {
    const request = pool.request();

    // Input parameters
    request.input("internId", sql.NVarChar, internId);
    request.input("fileData", sql.VarBinary(sql.MAX), req.file.buffer);

    // Dynamic column update query (column name can’t be parameterized)
    const query = `UPDATE dbo.internApplicants SET ${docName} = @fileData WHERE id = @internId`;

    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        message: `${docName} uploaded successfully for staff ${internId}`,
      });
    } else {
      res.status(404).json({ message: `intern ${internId} not found` });
    }
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getAllIntern,
  getInternById,
  getMetadata,
  downloadDocument,
  deleteDocument,
  uploadDocument,
  updateinternDetails,
  toggleInternStatus,
  createIntern,
};



module.exports = { getAllIntern, getInternById ,getMetadata ,downloadDocument,deleteDocument,uploadDocument,updateinternDetails,toggleInternStatus,createIntern};



