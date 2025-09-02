const { sql, getPool } = require('../config/dbconfig');

let pool;
(async () => {
  try {
    pool = await getPool();
  } catch (err) {
    console.error('DB connection error:', err);
  }
})();

// ✅ Get saved email config data
async function emailget(req, res) {
  console.log("enter get email")
  try {
    const request = await pool.request();
    const query = `SELECT Stage, ToEmails, CcEmails FROM emailManagement`;
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ success: false, message: 'Error fetching email configs' });
  }
}

// ✅ Save or update email config
async function emailsave(req, res) {
  console.log("enter save email",req.body);
  const { stage, toEmails, ccEmails } = req.body;

  try {
    const toStr = toEmails.join(',');
    const ccStr = ccEmails.join(',');

    const request = await pool.request();
    request.input('stage', sql.NVarChar, stage);
    request.input('to', sql.NVarChar(sql.MAX), toStr);
    request.input('cc', sql.NVarChar(sql.MAX), ccStr);

    const query = `
      IF EXISTS (SELECT 1 FROM emailManagement WHERE Stage = @stage)
        UPDATE emailManagement
        SET ToEmails = @to, CcEmails = @cc
        WHERE Stage = @stage;
      ELSE
        INSERT INTO emailManagement (Stage, ToEmails, CcEmails)
        VALUES (@stage, @to, @cc);
    `;

    await request.query(query);
    res.json({ success: true, message: 'Email config saved or updated' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, message: 'Error saving email config' });
  }
}

module.exports = { emailget, emailsave};
