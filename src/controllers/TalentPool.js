const { sql, getPool } = require('../config/dbconfig');

let pool;

(async () => {
  try {
    pool = await getPool();
  } catch (err) {
    console.error('Error while getting pool in talentpool controller', err);
  }
})();

/**
 * Get all people in talentpool
 */
async function getAllTalent(req, res) {
  console.log('getAllTalent called');
  try {
    const request = pool.request();
    const query = `
      SELECT personID, personName, dateOfBirth,
                                  contactNumber, mail,postFor,location
      FROM dbo.talentpool ORDER BY createdAt DESC
    `;
    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ talent: result.recordset });
    } else {
      return res.status(404).json({ message: 'No records found' });
    }
  } catch (err) {
    console.error('Error fetching talent:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

/**
 * Get person by ID
 */
async function getTalentById(req, res) {
  const id = req.params.id;

  if (!id) return res.status(400).json({ message: 'No ID provided' });

  try {
    const request = pool.request();
    request.input('id', sql.NVarChar(20), id);

    const query = `
      SELECT personID, personName, dateOfBirth,
                                  contactNumber, mail,postFor,location
      FROM dbo.talentpool
      WHERE personID = @id
    `;
    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ person: result.recordset[0] });
    } else {
      return res.status(404).json({ message: 'No records found' });
    }
  } catch (err) {
    console.error('Error fetching talent by ID:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

/**
 * Insert new person
 */
async function addTalent(req, res) {
  try {
    let data;
    try {
      data = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body.data;
    } catch {
      return res.status(400).json({ message: "Invalid JSON format in request body" });
    }

    if (!data) {
      return res.status(400).json({ message: "Missing person data or personID" });
    }

    const request = pool.request();

    // Match SQL schema definitions
    request.input("personName", sql.NVarChar(50), data.personName || null);
    request.input("dateOfBirth", sql.Date, data.dateOfBirth || null);
    request.input("contactNumber", sql.Numeric(10, 0), data.contactNumber || null);
    request.input("mail", sql.NVarChar(50), data.mail || null);
    request.input("postFor", sql.NVarChar(50), data.postfor || null);
    request.input("location", sql.NVarChar(50), data.location || null);

    // Handle uploaded files
    const files = {};
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (!files[file.fieldname]) files[file.fieldname] = [];
        files[file.fieldname].push(file);
      });
    } else if (req.files) {
      Object.assign(files, req.files);
    }

    const fileFields = {
      resumeFile: "ResumeFile",
      aadhaarFile: "AadhaarFile",
      panFile: "PANFile",
      academicFile: "AcademicCertificateFile",
      idCardFile: "IDCardFile",
      certFile10: "TenthCertificateFile",
      certFile12: "TwelfthCertificateFile",
      certFileGMDSS: "GMDSSCertificateFile",
      certFileIALA: "IALACertificateFile"
    };

    for (let [inputName, columnName] of Object.entries(fileFields)) {
      const file = files[inputName]?.[0] || null;
      request.input(inputName, sql.VarBinary(sql.MAX), file ? file.buffer : null);
    }

    const query = `
      INSERT INTO dbo.talentpool (
        personName,dateOfBirth,contactNumber, mail,postFor,location,
        ResumeFile,AadhaarFile, PANFile, AcademicCertificateFile, IDCardFile,
        TenthCertificateFile, TwelfthCertificateFile, GMDSSCertificateFile, IALACertificateFile
      )
      VALUES (
        @personName, @dateOfBirth,@contactNumber, @mail, @postFor, @location,
        @ResumeFile,@aadhaarFile, @panFile, @academicFile, @idCardFile,
        @certFile10, @certFile12, @certFileGMDSS, @certFileIALA
      )
    `;

    await request.query(query);
    res.json({ message: "Person inserted successfully" });
  } catch (err) {
    console.error("Error inserting person:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
}


/**
 * Update person
 */
async function updateTalent(req, res) {
  try {
    const {data} = req.body;

    if (!data || !data.personID) {
      return res.status(400).json({ message: 'Missing personID' });
    }

    const request = pool.request();
    request.input('personID', sql.NVarChar(50), data.personID);

    let updates = [];

    if (data.personName !== undefined) {
      updates.push('personName = @personName');
      request.input('personName', sql.NVarChar(50), data.personName);
    }
    if (data.dateOfBirth !== undefined) {
      updates.push('dateOfBirth = @dateOfBirth');
      request.input('dateOfBirth', sql.Date, data.dateOfBirth);
    }
    if (data.contactNumber !== undefined) {
      updates.push('contactNumber = @contactNumber');
      request.input('contactNumber', sql.Numeric(10,0), data.contactNumber);
    }
    if (data.mail !== undefined) {
      updates.push('mail = @mail');
      request.input('mail', sql.NVarChar(50), data.mail);
    }
    if (data.postfor !== undefined) {
      updates.push('postFor = @postFor');
      request.input('postFor', sql.NVarChar(50), data.postfor);
    }
    if (data.location !== undefined) {
      updates.push('location = @location');
      request.input('location', sql.NVarChar(50), data.location);
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const query = `
      UPDATE dbo.talentpool
      SET ${updates.join(', ')}
      WHERE personID = @personID
    `;

    const result = await request.query(query);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }

    res.json({ message: 'Person updated successfully' });
  } catch (err) {
    console.error('Error updating person:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

/**
 * Document columns in talentpool
 */
const documentColumns = [
   'ResumeFile','AadhaarFile', 'PANFile', 'AcademicCertificateFile', 'IDCardFile',
  'TenthCertificateFile', 'TwelfthCertificateFile',
  'GMDSSCertificateFile', 'IALACertificateFile'
];

function getNameMap(reverse = false) {
  const map = {
    ResumeFile: "Resume",
    AadhaarFile: "Aadhaar",
    PANFile: "PAN",
    AcademicCertificateFile: "Academic Certificate",
    IDCardFile: "ID Card",
    TenthCertificateFile: "SSLC Certificate",
    TwelfthCertificateFile: "HLC Certificate",
    GMDSSCertificateFile: "GMDSS Certificate",
    IALACertificateFile: "IALA Certificate"
  };

  if (!reverse) return map;

  // Create reverse mapping (display -> DB column)
  const reversed = {};
  for (const [dbName, displayName] of Object.entries(map)) {
    reversed[displayName] = dbName;
  }
  return reversed;
}

async function getMetadata(req, res) {
  const personID = req.params.id;

  try {
    const request = pool.request();
    request.input('personID', sql.NVarChar, personID);

    const query = `
      SELECT ${documentColumns.map(col => `CASE WHEN ${col} IS NOT NULL THEN 1 ELSE 0 END AS has${col}`).join(', ')}
      FROM dbo.talentpool
      WHERE personID = @personID
    `;

    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }

    const row = result.recordset[0];
    const nameMap = getNameMap();

    const metadata = documentColumns.map(col => ({
      name: nameMap[col] || col,
      exists: row[`has${col}`] === 1
    }));

    res.json(metadata);
  } catch (err) {
    console.error('Error fetching metadata:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

async function downloadDocument(req, res) {
  const { personID, docName } = req.params;

  const reverseMap = getNameMap(true);
  const dbColumn = reverseMap[docName] || docName;

  if (!documentColumns.includes(dbColumn)) {
    return res.status(400).json({ message: 'Invalid document name' });
  }

  try {
    const request = pool.request();
    request.input('personID', sql.NVarChar, personID);

    const query = `SELECT ${dbColumn} AS DocumentData FROM dbo.talentpool WHERE personID = @personID`;
    const result = await request.query(query);

    if (result.recordset.length === 0 || !result.recordset[0].DocumentData) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const fileBuffer = result.recordset[0].DocumentData;
    res.setHeader('Content-Disposition', `attachment; filename=${docName}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(fileBuffer);
  } catch (err) {
    console.error('Error downloading document:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

/**
 * Upload a document
 */
async function uploadDocument(req, res) {
  const { personID, docName } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const reverseMap = getNameMap(true);
  const dbColumn = reverseMap[docName] || docName;

  if (!documentColumns.includes(dbColumn)) {
    return res.status(400).json({ message: 'Invalid document name' });
  }

  try {
    const request = pool.request();
    request.input('personID', sql.NVarChar, personID);
    request.input('fileData', sql.VarBinary(sql.MAX), req.file.buffer);

    const query = `UPDATE dbo.talentpool SET ${dbColumn} = @fileData WHERE personID = @personID`;
    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: `${docName} uploaded successfully` });
    } else {
      res.status(404).json({ message: 'Person not found' });
    }
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

/**
 * Delete a document
 */
async function deleteDocument(req, res) {
  const { personID, docName } = req.params;

  const reverseMap = getNameMap(true);
  const dbColumn = reverseMap[docName] || docName;

  if (!documentColumns.includes(dbColumn)) {
    return res.status(400).json({ message: 'Invalid document name' });
  }

  try {
    const request = pool.request();
    request.input('personID', sql.NVarChar, personID);

    const query = `UPDATE dbo.talentpool SET ${dbColumn} = NULL WHERE personID = @personID`;
    const result = await request.query(query);

    if (result.rowsAffected[0] > 0) {
      res.json({ message: `${docName} deleted successfully` });
    } else {
      res.status(404).json({ message: 'Person not found' });
    }
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

async function checkID(req, res) {
  const id = req.params.id;

  if (!id) return res.status(400).json({ message: 'No ID provided' });

  try {
    const request = pool.request();
    request.input('id', sql.NVarChar(20), id);

    const query = `
      SELECT personID
      FROM dbo.talentpool
      WHERE personID = @id
    `;
    const result = await request.query(query);
    if(result.recordset.personID===id){
      return res.json({ message: "Id exist" });
    }else {
      return res.json({ message: "Id does not exist" });
    }
  } catch (err) {
    console.error('Error fetching talent by ID:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}


module.exports = {
  getAllTalent,
  checkID,
  getTalentById,
  addTalent,
  updateTalent,
  getMetadata,
  downloadDocument,
  uploadDocument,
  deleteDocument
};
