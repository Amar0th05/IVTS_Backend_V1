const { sql, getPool } = require("../config/dbconfig");
const mailer = require("nodemailer");
 
// Create transporter (Nodemailer)
const transporter = mailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
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
 
// insert intern application data
 
async function createIntern(req, res) {
  console.log("Creating intern:", req.body);
 
  if (!req.files) {
    return res.status(400).json({ message: "File uploads are missing." });
  }
 
  try {
    const data = req.body;
    const files = req.files;
 
    const request = pool.request();
    request.input("FullName", sql.NVarChar, data.fullName);
    request.input("DateOfBirth", sql.Date, data.dob);
    request.input("Gender", sql.NVarChar, data.gender);
    request.input("OtherGender", sql.NVarChar, data.otherGender || null);
    request.input("MobileNumber", sql.VarChar, data.mobile);
    request.input("CurrentLocation", sql.NVarChar, data.location);
    request.input("Email", sql.NVarChar, data.email);
    request.input("PortfolioLink", sql.NVarChar, data.portfolio || null);
    request.input("EmergencyContactName", sql.NVarChar, data.emergencyName);
    request.input(
      "EmergencyContactRelationship",
      sql.NVarChar,
      data.relationship
    );
    request.input("EmergencyContactNumber", sql.VarChar, data.emergencyNumber);
    request.input("CollegeName", sql.NVarChar, data.college);
    request.input("DegreeProgram", sql.NVarChar, data.degree);
    request.input(
      "IsPartOfCurriculum",
      sql.Bit,
      data.curriculum === "yes" ? 1 : 0
    );
    request.input("FacultySupervisor", sql.NVarChar, data.supervisor || null);
    request.input("PreferredStartDate", sql.Date, data.startDate);
    request.input("PreferredEndDate", sql.Date, data.endDate);
    request.input("InternshipMode", sql.NVarChar, data.mode);
    request.input("HowHeardAboutUs", sql.NVarChar, data.source);
    request.input("status", sql.Bit, 1);
 
    // File fields
    request.input(
      "BonafideFile",
      sql.VarBinary(sql.MAX),
      files?.bonafide?.[0]?.buffer || null
    );
    request.input(
      "ResumeFile",
      sql.VarBinary(sql.MAX),
      files?.resume?.[0]?.buffer || null
    );
    request.input(
      "PhotoFile",
      sql.VarBinary(sql.MAX),
      files?.photo?.[0]?.buffer || null
    );
    request.input(
      "IdProofFile",
      sql.VarBinary(sql.MAX),
      files?.aadhar?.[0]?.buffer || null
    );
    // Run query
    await request.query(`
      INSERT INTO dbo.internApplicants (
        FullName, DateOfBirth, Gender, OtherGender, MobileNumber, CurrentLocation, Email, PortfolioLink,
        EmergencyContactName, EmergencyContactRelationship, EmergencyContactNumber,
        CollegeName, DegreeProgram, IsPartOfCurriculum, FacultySupervisor,
        PreferredStartDate, PreferredEndDate, InternshipMode, HowHeardAboutUs,
        BonafideFileData, ResumeFileData, PhotoFileData, IdProofFileData, status
      ) VALUES (
        @FullName, @DateOfBirth, @Gender, @OtherGender, @MobileNumber, @CurrentLocation, @Email, @PortfolioLink,
        @EmergencyContactName, @EmergencyContactRelationship, @EmergencyContactNumber,
        @CollegeName, @DegreeProgram, @IsPartOfCurriculum, @FacultySupervisor,
        @PreferredStartDate, @PreferredEndDate, @InternshipMode, @HowHeardAboutUs,
        @BonafideFile, @ResumeFile, @PhotoFile, @IdProofFile, @status
      )
    `);
 
    const internData = {
      FullName: data.fullName,
      Email: data.email,
      MobileNumber: data.mobile,
      CollegeName: data.college,
      DegreeProgram: data.degree,
      PreferredStartDate: data.startDate,
      PreferredEndDate: data.endDate,
    };
 
    await sendVendorCreated(
      data.email,
      "amarnath.t@ntcpwc.iitm.ac.in",
      internData
    );
 
 
    // Send mail to HR
    await sendHRMail(
      process.env.HR_CC_EMAIL,
      data
    );
 
   
 
    console.log(" sendVendorCreated function called successfully!");
 
 
 
    return res.status(200).json({
      message: "Application Submitted Successfully and mail sent!",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Failed to submit application.", error: err.message });
    }
  }
}
 
async function sendVendorCreated(To, cc, data) {
  console.log("Sending intern email for:", data.FullName);
 
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: To,
    cc: cc,
    subject: `New Internship Registration – ${data.FullName}`,
    html: `
<p>Dear HR,</p>
<p>A new internship registration has been submitted. Please find the details below:</p>
 
<p><b>Intern Details:</b></p>
<ul>
  <li><b>Name:</b> ${data.FullName}</li>
  <li><b>Email:</b> ${data.Email}</li>
  <li><b>Phone:</b> ${data.MobileNumber}</li>
  <li><b>University/College:</b> ${data.CollegeName}</li>
  <li><b>Course/Program:</b> ${data.DegreeProgram}</li>
  <li><b>Expected Start Date:</b> ${data.PreferredStartDate}</li>
  <li><b>Expected End Date:</b> ${data.PreferredEndDate}</li>
</ul>
 
<p>Please review the application and take necessary action.</p>
 
<p>Best regards,<br>
WorkSphere <br>
NTCPWC IITM</p>
`,
  };
 
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    return true;
  } catch (err) {
    console.error("Email sending failed:", err);
    return false;
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
    request.input("FullName", sql.NVarChar, data.fullName);
    request.input("DateOfBirth", sql.Date, data.dob);
    request.input("Gender", sql.NVarChar, data.gender);
    request.input("OtherGender", sql.NVarChar, data.otherGender || null);
    request.input("MobileNumber", sql.VarChar, data.mobile);
    request.input("CurrentLocation", sql.NVarChar, data.location);
    request.input("Email", sql.NVarChar, data.email);
    request.input("PortfolioLink", sql.NVarChar, data.portfolio || null);
    request.input("EmergencyContactName", sql.NVarChar, data.emergencyName);
    request.input(
      "EmergencyContactRelationship",
      sql.NVarChar,
      data.relationship
    );
    request.input("EmergencyContactNumber", sql.VarChar, data.emergencyNumber);
    request.input("CollegeName", sql.NVarChar, data.college);
    request.input("DegreeProgram", sql.NVarChar, data.degree);
    request.input(
      "IsPartOfCurriculum",
      sql.Bit,
      data.curriculum === "yes" ? 1 : 0
    );
    request.input("FacultySupervisor", sql.NVarChar, data.supervisor || null);
    request.input("PreferredStartDate", sql.Date, data.startDate);
    request.input("PreferredEndDate", sql.Date, data.endDate);
    request.input("InternshipMode", sql.NVarChar, data.mode);
    request.input("HowHeardAboutUs", sql.NVarChar, data.source);
    request.input("status", sql.Bit, 1);
 
    // File fields
    request.input(
      "BonafideFile",
      sql.VarBinary(sql.MAX),
      files?.bonafide?.[0]?.buffer || null
    );
    request.input(
      "ResumeFile",
      sql.VarBinary(sql.MAX),
      files?.resume?.[0]?.buffer || null
    );
    request.input(
      "PhotoFile",
      sql.VarBinary(sql.MAX),
      files?.photo?.[0]?.buffer || null
    );
    request.input(
      "IdProofFile",
      sql.VarBinary(sql.MAX),
      files?.aadhar?.[0]?.buffer || null
    );
 
 
 
    // Run query
    await request.query(`
      INSERT INTO dbo.internApplicants (
        FullName, DateOfBirth, Gender, OtherGender, MobileNumber, CurrentLocation, Email, PortfolioLink,
        EmergencyContactName, EmergencyContactRelationship, EmergencyContactNumber,
        CollegeName, DegreeProgram, IsPartOfCurriculum, FacultySupervisor,
        PreferredStartDate, PreferredEndDate, InternshipMode, HowHeardAboutUs,
        BonafideFileData, ResumeFileData, PhotoFileData, IdProofFileData, status
      ) VALUES (
        @FullName, @DateOfBirth, @Gender, @OtherGender, @MobileNumber, @CurrentLocation, @Email, @PortfolioLink,
        @EmergencyContactName, @EmergencyContactRelationship, @EmergencyContactNumber,
        @CollegeName, @DegreeProgram, @IsPartOfCurriculum, @FacultySupervisor,
        @PreferredStartDate, @PreferredEndDate, @InternshipMode, @HowHeardAboutUs,
        @BonafideFile, @ResumeFile, @PhotoFile, @IdProofFile, @status
      )
    `);
 
    // Send mail to HR
    await sendHRMail(
      process.env.HR_CC_EMAIL,
      data
    );
 
    // Send confirmation mail to Intern
    await sendInternMail(data.email, data.fullName);
 
    console.log("✅ Both HR and Intern mails sent successfully!");
 
    return res.status(200).json({
      message: "Application Submitted Successfully and mails sent!",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Failed to submit application.", error: err.message });
    }
  }
}
 
async function sendHRMail(To, data) {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: To,
    subject: `New Internship Registration – ${data.fullName}`,
    html: `
      <p>Dear HR,</p>
      <p>A new internship registration has been submitted. Please find the details below:</p>
      <ul>
        <li><b>Name:</b> ${data.fullName}</li>
        <li><b>Email:</b> ${data.email}</li>
        <li><b>Phone:</b> ${data.mobile}</li>
        <li><b>University/College:</b> ${data.college}</li>
        <li><b>Course/Program:</b> ${data.degree}</li>
     
      </ul>
      <p>Please review the application and take necessary action.</p>
      <p>Best regards,<br/>WorkSphere<br/>NTCPWC IITM</p>
    `,
  };
 
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Error sending HR mail:", err);
    return false;
  }
}
 
async function sendInternMail(to, name) {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: to,
    subject: "Internship Registration Successful – NTCPWC, IITM",
    html: `
      <p>Dear ${name},</p>
      <p>Congratulations! Your internship registration with <b>NTCPWC, IITM</b> has been successfully submitted.</p>
      <p>Our HR team will review your application and get in touch with you shortly regarding the next steps.</p>
      <p>We are excited to have you explore opportunities with NTCPWC and look forward to your contributions.</p>
      <p>Best regards,<br/>Team NTCPWC</p>
    `,
  };
 
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("❌ Error sending Intern mail:", err);
    return false;
  }
}
 
// get all interns
async function getAllIntern(req, res) {
  try {
    const request = pool.request();
 
    const query = `
      SELECT
        [Id], -- add a PK for identifying records
        [internId],
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
        [StartDate],
        [EndDate],
        [InternshipMode],
        [HowHeardAboutUs],
        [SubmissionDate],
        [status],
        [stipend] AS stipendAmount,
        [secondaryReportingManager]
      FROM dbo.internApplicants
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
  
 
  if (!id) {
    return res.status(404).json({ message: `no ${id} found` });
  }
 
  try {
    const request = await pool.request();
 
    await request.input("interId", sql.Int, id);
 
    const query = `
             SELECT
             [id],
             [internId],
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
        [StartDate],
        [EndDate],
        [InternshipMode],
        [HowHeardAboutUs],
        [SubmissionDate],
        [Reporting_Manager],
        [Acceptance_GenerateDate],
        [Completion_GenerateDate],
        [stipend] AS stipendAmount,
        [secondaryReportingManager]
      FROM dbo.internApplicants
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

    // Helper to convert empty string to null
    function parseDateOrNull(value) {
      return value && value.trim() !== "" ? value : null;
    }

    let updates = [];

    // Regular string/number fields
    if (data.fullName !== undefined) {
      updates.push("FullName = @FullName");
      request.input("FullName", sql.NVarChar(100), data.fullName);
    }

    if (data.dateOfBirth !== undefined) {
      updates.push("DateOfBirth = @DateOfBirth");
      request.input("DateOfBirth", sql.Date, parseDateOrNull(data.dateOfBirth));
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
      request.input("EmergencyContactName", sql.NVarChar(100), data.emergencyContactName);
    }

    if (data.emergencyContactRelationship !== undefined) {
      updates.push("EmergencyContactRelationship = @EmergencyContactRelationship");
      request.input("EmergencyContactRelationship", sql.NVarChar(50), data.emergencyContactRelationship);
    }

    if (data.emergencyContactNumber !== undefined) {
      updates.push("EmergencyContactNumber = @EmergencyContactNumber");
      request.input("EmergencyContactNumber", sql.NVarChar(15), data.emergencyContactNumber);
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
      request.input("IsPartOfCurriculum", sql.Bit, data.isPartOfCurriculum.toLowerCase() === "yes" ? 1 : 0);
    }

    if (data.facultySupervisor !== undefined) {
      updates.push("FacultySupervisor = @FacultySupervisor");
      request.input("FacultySupervisor", sql.NVarChar(100), data.facultySupervisor);
    }

    // ✅ Date fields safely converted
    if (data.preferredStartDate !== undefined) {
      updates.push("PreferredStartDate = @PreferredStartDate");
      request.input("PreferredStartDate", sql.Date, parseDateOrNull(data.preferredStartDate));
    }

    if (data.preferredEndDate !== undefined) {
      updates.push("PreferredEndDate = @PreferredEndDate");
      request.input("PreferredEndDate", sql.Date, parseDateOrNull(data.preferredEndDate));
    }

    if (data.StartDate !== undefined) {
      updates.push("StartDate = @StartDate");
      request.input("StartDate", sql.Date, parseDateOrNull(data.StartDate));
    }

    if (data.EndDate !== undefined) {
      updates.push("EndDate = @EndDate");
      request.input("EndDate", sql.Date, parseDateOrNull(data.EndDate));
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
      request.input("SubmissionDate", sql.Date, parseDateOrNull(data.submissionDate));
    }

     if (data.reportingManager !== undefined) {
      updates.push("Reporting_Manager = @Reporting_Manager");
      request.input("Reporting_Manager", sql.NVarChar(150), data.reportingManager || null);
    }
     if (data. secondaryReportingManager !== undefined) {
      updates.push("secondaryReportingManager = @secondaryReportingManager");
      request.input("secondaryReportingManager", sql.NVarChar(150), data.secondaryReportingManager || null);
    }

      if (data.stipendAmount !== undefined  && data.stipendAmount == "") {
      updates.push("stipend = @stipend");
      request.input("stipend", sql.NVarChar(150), null);
    }
    else{
      updates.push("stipend = @stipend");
      request.input("stipend", sql.NVarChar(150), data.stipendAmount);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const query = `UPDATE dbo.internApplicants SET ${updates.join(", ")} WHERE id = @id`;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Intern ID not found" });
    }

    return res.json({ message: "Intern details updated successfully" });
  } catch (err) {
    console.error("Error updating intern details:", err);
    return res.status(500).json({
      message: err.response?.data?.message || err.message || "Internal Server Error",
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
  { name: "Bonafide", exists: false },
  { name: "Resume", exists: false },
  { name: "Photo", exists: false },
  { name: "Aadhar", exists: false },
];
 
      return res.json(metadata);
    }
 
    const row = result.recordset[0];
 
    // Build metadata array expected by frontend
    const metadata = [
      { name: "Bonafide", exists: row.BonafideFileData === 1 },
      { name: "Resume", exists: row.ResumeFileData === 1 },
      { name: "Photo", exists: row.PhotoFileData === 1 },
      { name: "Aadhar", exists: row.IdProofFileData === 1 },
    ];
 
    res.json(metadata);
  } catch (error) {
    console.error("Error fetching document metadata:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
 
// Map docName to actual column in DB
const documentColumnMap = {
  Bonafide: "BonafideFileData",
  Resume: "ResumeFileData",
  Photo: "PhotoFileData",
  Aadhar: "IdProofFileData",
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
    console.log(fileBuffer,"file");
 
    // Set headers for PDF file download
    
    if(docName =="Photo"){
      res.setHeader("Content-Disposition", `attachment; filename=${docName}.png`);
      res.setHeader("Content-Type", "image/png");
      console.log("photo downloaded");
    }
    else{
    res.setHeader("Content-Disposition", `attachment; filename=${docName}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    console.log("pdf downloaded");
    }
    // Send the PDF binary data as the response
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
 
// delete
// const allowedColumns = {
//   Bonafide: "BonafideFileData",
//   Resume: "ResumeFileData",
//   Photo: "PhotoFileData",
//   IdProof: "IdProofFileData",
// };


async function deleteDocument(req, res) {
  const { internId, docName } = req.params;
  const column = documentColumnMap[docName];
 
  if (!column) {
    return res.status(400).json({ error: "Invalid document name" });
  }
 
  try {
    const request = pool.request();
 
    // Build query with the validated column name (no parameterization for column)
    const query = `UPDATE dbo.internApplicants SET ${column} = NULL WHERE id = @internId`;
 
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
// const allowedDocColumns = {
//   Bonafide: "BonafideFileData",
//   Resume: "ResumeFileData",
//   Photo: "PhotoFileData",
//   IdProof: "IdProofFileData",
// };


 
async function uploadDocument(req, res) {
  const { internId, docName } = req.params;
  const column = documentColumnMap[docName];
 
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
 
  if (!column) {
    return res.status(400).json({ message: "Invalid document name" });
  }
 
  try {
    const request = pool.request();
 
    // Input parameters
    request.input("internId", sql.NVarChar, internId);
    request.input("fileData", sql.VarBinary(sql.MAX), req.file.buffer);
 
    // Dynamic column update query (column name can’t be parameterized)
    const query = `UPDATE dbo.internApplicants SET ${column} = @fileData WHERE id = @internId`;
 
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
 
// GET REPORTINGT MANAGER
async function getReportingManager(req, res) {
  console.log("getstaff enter");
  try {
    // ✅ SQL Server query to fetch all staff
    const result = await pool.request().query(`
      SELECT
                [Employee_ID_if_already_assigned] AS id,
                [Staff_Name] AS name
            FROM
                [dbo].[Staffs]
            WHERE
                [Designation] IN (
                    'Project Officer',
                    'Principal Project Officer',
                    'Senior  Project officer',
                    'Principal  Project officer',
                    'Principal Project Scientist'

                );
    `);

    res.json({staffid:result.recordset});
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ err: "Server error" });
  }
}


//update intern
async function generateDate(req, res) {
  try {
    const request = pool.request();
    const { data } = req.body;
    const id = req.params.id;

    // Input parameters
    request.input("id", sql.Int, id);
    request.input("date", sql.Date, data.generateDate);

    const query = `UPDATE dbo.internApplicants SET ${data.generateName}=@date WHERE id = @id`;

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Intern ID not found" });
    }

    return res.json({ message: "Intern details updated successfully" });
  } catch (err) {
    console.error("Error updating intern Generate date:", err);
    return res.status(500).json({
      message: err.response?.data?.message || err.message || "Internal Server Error",
    });
  }
}


// stipendAmount
// app.post("/api/save-stipend", async (req, res) => {
//   try {
//     const { stipendAmount } = req.body;

//     // insert or update your DB record
//     const query = `
//       INSERT INTO InternDetails (StipendAmount)
//       VALUES (${stipendAmount === null ? 'NULL' : stipendAmount})
//     `;

//     await pool.request().query(query);

//     res.status(200).json({
//       message: "Stipend saved successfully",
//       stipend: stipendAmount
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Database error" });
//   }
// });



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
  getReportingManager,
  generateDate
};