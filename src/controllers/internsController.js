const { sql, getPool } = require("../config/dbconfig");

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error while getting pool in invoice controller", err);
    }
})();



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
        [SubmissionDate]
        -- do not select VARBINARY here to avoid huge payload
      FROM [IVTS_MANAGEMENT].[dbo].[internApplicants]
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ internDetails: result.recordset });
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

// download file endpoint
async function downloadInternFile(req, res) {
  console.log("enter");
  const { id, fileType } = req.params;
  console.log(id,fileType);

  try {
    const request = pool.request();
    const query = `
      SELECT 
        ${fileType} AS FileData
      FROM [IVTS_MANAGEMENT].[dbo].[internApplicants]
      WHERE Id = @id
    `;

    request.input('id', id);
    const result = await request.query(query);

    if (result.recordset.length === 0 || !result.recordset[0].FileData) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileBuffer = result.recordset[0].FileData;

    // map type → filename
    const fileNames = {
      BonafideFileData: "bonafide.pdf",
      ResumeFileData: "resume.pdf",
      PhotoFileData: "photo.jpg",
      IdProofFileData: "idproof.pdf"
    };

    const fileName = fileNames[fileType] || "download.bin";

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
}


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

    res.status(200).json({ message: 'Application submitted successfully!' });

  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Failed to submit application.', error: err.message });
  }
}

module.exports = { getAllIntern,downloadInternFile,createIntern };