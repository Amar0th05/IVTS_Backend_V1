const {getPool} = require("../config/dbconfig");
const mailer = require("nodemailer");
let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error initializing database pool:", err);
    }
})();

//get mail
async function getFundCheckMails(){
    try{
        const request = await pool.request();
        const query = `select mail from tbl_user
                              left join tbl_role_module_perms on tbl_role_module_perms.RoleID=tbl_user.role
                              where tbl_role_module_perms.ModuleID=12 and CanWrite=1;
        ;`
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return result.recordset;
        }
        return null;
    }catch(err){
        console.log(err);
        return null;
    }
}

async function getIndentApprovalMails(){
    try{
        const request = await pool.request();
        const query = `select mail from tbl_user
                              left join tbl_role_module_perms on tbl_role_module_perms.RoleID=tbl_user.role
                              where tbl_role_module_perms.ModuleID=14 and CanWrite=1;`
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            return result.recordset;
        }
        return null;
    }catch(err){
        console.log(err);
        return null;
    }
}

async function getIndentCreatedMails() {
  try{
    const request = await pool.request();
    const query = `select mail from tbl_user
                              left join tbl_role_module_perms on tbl_role_module_perms.RoleID=tbl_user.role
                              where tbl_role_module_perms.ModuleID=14 and CanWrite=1;`;
     const result = await request.query(query);
      if (result.recordset.length > 0) {
        return result.recordset;
        }
        return null;
  }catch(err){
    console.log(err);
    return null;  
  }
  
}

// const transporter=mailer.createTransport({
//     service: 'hotmail',
//     auth:{
//         user:process.env.EMAIL_SENDER,
//         pass:process.env.EMAIL_PASSWORD
//     }
// });

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

// send mail

async function sendVendorCreated(To, cc, data) {
  console.log('Sending vendor created email to:', To, 'CC:', cc);
  const mailOptions = {
  from: process.env.EMAIL_SENDER,
  to: To, // add recipients here
  cc: cc, // add CC recipients here
  subject: "New Vendor Created",
html: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
      <div style="background: #0775d4; padding: 15px; text-align: center; color: white; font-size: 18px; font-weight: bold;">
        New Vendor Created
      </div>
      <div style="padding: 20px;">
        <p>Dear Staff's,</p>
        <p>A new vendor has been created. Please find the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Name</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Address</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAddress}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Phone No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPhone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Mail ID</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorMailAddress}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor GST No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorGST}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor PAN No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPAN}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Account No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAccountNumber}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor IFSC Code</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorIFSC}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Bank Name</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorBank}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Bank Address</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorBranch}</td></tr>
        </table>

        <!-- Back to portal button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL_PROD}" 
             style="display:inline-block; background:#0775d4; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">
             Go to Portal
          </a>
        </div>

        <p style="margin-top: 20px;">Regards,<br><b>IVTMS Management Portal</b></p>
      </div>
    </div>
  </div>
`

};

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
  
}


async function sendIndentApprovalAlert(data){
    let mails = await getIndentApprovalMails();
    console.log(mails);
    await Promise.all(mails.map(mail => sendIndentApprovalNotification(mail.mail, data)));
}

async function sendFundCheckAlert(To, Cc, data) {
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: To,
        cc: Cc,
        subject: `Action Required – New Indent Created ${data.IndentID} – Update Fund Availability in Portal`,
html: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
      
      <!-- Header -->
      <div style="background: #0775d4; padding: 15px; text-align: center; color: white; font-size: 18px; font-weight: bold;">
        New Vendor Created
      </div>

      <!-- Body -->
      <div style="padding: 20px;">
        <p>Dear Staff,</p>
        <p>A new vendor has been created. Please find the details below:</p>
        
        <!-- Vendor Details Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Name</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorName || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Address</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAddress || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Phone No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPhone || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Mail ID</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorMailAddress || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor GST No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorGST || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor PAN No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPAN || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Account No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAccountNumber || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor IFSC Code</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorIFSC || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Bank Name</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorBank || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Bank Address</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorBranch || '-'}</td></tr>
        </table>

        <!-- Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL_PROD}" 
             style="display:inline-block; background:#0775d4; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">
             Go to Portal
          </a>
        </div>

        <!-- Footer -->
        <p style="margin-top: 20px;">Regards,<br><b>IVTMS Management Portal</b></p>
      </div>
    </div>
  </div>
`


    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Invoice upload alert sent to:', To, 'CC:', Cc);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}


async function sendIndentApprovalNotification(email,data){
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: ` Indent ID ${data.IndentID}: LPC Completed - Verification Required`,
        html: `
            Dear Sir / Madam, <br>
<br>
This is an automated notification to inform you that the LPC has been successfully completed for the indent with ID <b>${data.IndentID}</b>, completed by <b>${data.CreatedBy}</b>. 
<br><br>
Please find the details below.
<br><br>
You are kindly requested to verify the indent and take appropriate action (Approve / Reject / Revert Back) in the portal.
<br>
<br>
<table style="border-collapse: collapse; width: 100%;">
  <tr>
    <th style="border: 1px solid black; padding: 10px;"><b>Product Name</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Item Name</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Description</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Item Classification</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Quantity</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Unit Price</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Estimated Amount</b></th>
    <th style="border: 1px solid black; padding: 10px;"><b>Remarks</b></th>
  </tr>
  ${data.items.map(item => `
    <tr>
      <td style="border: 1px solid black; padding: 10px;">${item.ProductName}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.ItemName}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.Description}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.ItemClassification}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.Quantity}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.EstimatedUnitPrice}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.EstimatedTotalPrice}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.Remarks||''}</td>
    </tr>
  `).join('')}
</table>

<br>
<br>
<table  style="border-collapse: collapse;width: 50%;">
  <tr>
    <td style="padding: 10px;">SUM :</td>
    <td style="padding: 10px;">${data.price}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Project No :</td>
    <td style="padding: 10px;">${data.ProjectNo}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor Name :</td>
    <td style="padding: 10px;">${data.VendorName}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor Address :</td>
    <td style="padding: 10px;">${data.VendorAddress}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor Phone :</td>
    <td style="padding: 10px;">${data.VendorPhone}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor Mail ID :</td>
    <td style="padding: 10px;">${data.VendorMail}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor GST NO :</td>
    <td style="padding: 10px;">${data.VendorGST}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">vendor PAN No :</td>
    <td style="padding: 10px;">${data.VendorPAN||'-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor Account NO :</td>
    <td style="padding: 10px;">${data.VendorAccount}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Vendor IFSC Code :</td>
    <td style="padding: 10px;">${data.VendorIFSC}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Type Of Indent :</td>
    <td style="padding: 10px;">${data.TypeOfIndent}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Mode Of Purchase :</td>
    <td style="padding: 10px;">${data.indentMode}</td>
  </tr>
  <tr>
    
      <td style="padding: 10px;">Purpose :</td>
      <td style="padding: 10px;">${data.indentPurpose}</td>
    
  </tr>
  <tr>
    <td style="padding: 10px;">Extra GST :</td>
    <td style="padding: 10px;">${data.ExtraGST}%</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Price :</td>
    <td style="padding: 10px;">${data.Price}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Payment :</td>
    <td style="padding: 10px;">${data.Payment}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Delivery Place :</td>
    <td style="padding: 10px;">${data.DeliveryPlace}</td>
  </tr>
  <tr>
    <td style="padding: 10px;">Delivery Time :</td>
    <td style="padding: 10px;">${data.Delivery}</td>
  </tr>
</table>
<br><br>

<a style="color: white;background-color: rgb(7, 117, 212);border-radius: 5px;padding: 10px 20px 10px 20px;" href="${process.env.CLIENT_URL}">Go To Portal</a>
<br><br>
<br>
<p>Regards,</p>
<b>IVTMS Management Portal</b>
       `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Invoice upload alert sent to:', email);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function notifyIndenter(To,cc,data){


    const date = data.CreatedAt.toISOString().split('T')[0];


    const time = data.CreatedAt.toISOString().split('T')[1].substring(0, 5);

    const message = `This is an automated notification to inform you that your indent with ID <b>${data.IndentID}</b> has been created successfully on <b>${date}</b> at <b>${time}</b>.<br><br>`;
const mailOptions = {
  from: process.env.EMAIL_SENDER,
  to: To,
  cc: cc,
  subject: `Confirmation of Indent Creation – Indent ID ${data.IndentID} Successfully Generated`,
  html: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 800px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
      
      <!-- Header -->
      <div style="background: #0775d4; padding: 15px; text-align: center; color: white; font-size: 18px; font-weight: bold;">
        Indent Confirmation – ID ${data.IndentID}
      </div>

      <!-- Body -->
      <div style="padding: 20px;">
        <p>Dear Staff(s),</p>
        <p>${message}</p>
        <p>Please find the indent details below:</p>

        <!-- Items Table -->
        <h3 style="margin-top:20px;color:#0775d4;">Item Details</h3>
        <table style="width:100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr style="background:#f1f5f9; text-align:left;">
              <th style="border:1px solid #ddd; padding:8px;">Product Name</th>
              <th style="border:1px solid #ddd; padding:8px;">Item Name</th>
              <th style="border:1px solid #ddd; padding:8px;">Description</th>
              <th style="border:1px solid #ddd; padding:8px;">Classification</th>
              <th style="border:1px solid #ddd; padding:8px;">Qty</th>
              <th style="border:1px solid #ddd; padding:8px;">Unit Price</th>
              <th style="border:1px solid #ddd; padding:8px;">Est. Amount</th>
              <th style="border:1px solid #ddd; padding:8px;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="border:1px solid #ddd; padding:8px;">${item.productName}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.name}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.desc}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.classification}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.qty}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.price}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.estTotalPrice}</td>
                <td style="border:1px solid #ddd; padding:8px;">${item.remarks || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Vendor & Indent Info -->
        <h3 style="margin-top:20px;color:#0775d4;">Vendor & Indent Details</h3>
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">SUM</td><td style="padding:8px;border:1px solid #ddd;">${data.price}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Project No</td><td style="padding:8px;border:1px solid #ddd;">${data.ProjectNo}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Name</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Address</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAddress}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Phone</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPhone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Mail ID</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorMail}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor GST No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorGST}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor PAN No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorPAN || '-'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor Account No</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorAccount}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Vendor IFSC Code</td><td style="padding:8px;border:1px solid #ddd;">${data.VendorIFSC}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Type Of Indent</td><td style="padding:8px;border:1px solid #ddd;">${data.TypeOfIndent}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Mode Of Purchase</td><td style="padding:8px;border:1px solid #ddd;">${data.indentMode}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Purpose</td><td style="padding:8px;border:1px solid #ddd;">${data.indentPurpose}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Extra GST</td><td style="padding:8px;border:1px solid #ddd;">${data.ExtraGST}%</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Price</td><td style="padding:8px;border:1px solid #ddd;">${data.Price}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Payment</td><td style="padding:8px;border:1px solid #ddd;">${data.Payment}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f1f5f9;">Delivery Place</td><td style="padding:8px;border:1px solid #ddd;">${data.DeliveryPlace}</td></tr>
        </table>

        <!-- Portal Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" 
             style="display:inline-block; background:#0775d4; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">
             Go to Portal
          </a>
        </div>

        <p style="color:#555; font-size:13px;">** Please keep the Indent ID for your reference.</p>
        <p style="margin-top: 20px;">Regards,<br><b>iVTS-FMS</b></p>
      </div>
    </div>
  </div>
  `
};


    try {
        await transporter.sendMail(mailOptions);
        console.log('Invoice upload alert sent to:', To, cc);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

async function sendndentCreated(email, data) {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: `Indent ID ${data.IndentID}: LPC Completed - Verification Required`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
        <div style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e1e1; padding: 20px; margin: auto; border-radius: 8px;">
          <h2 style="color: #0a75c2;">New Vendor Created</h2>
          <p>Dear Vendor Admins and Staff,</p>
          <p>A new vendor has been created. Please find the details below:</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td><strong>Vendor Name</strong></td><td>APJ ENTERPRISES</td></tr>
            <tr><td><strong>Vendor Address</strong></td><td>#07, Jayaram Nagar, Karanaipuduchery, Chennai-603202</td></tr>
            <tr><td><strong>Phone No</strong></td><td>8610359433</td></tr>
            <tr><td><strong>Email ID</strong></td><td>info@apjtrade@gmail.com</td></tr>
            <tr><td><strong>GST No</strong></td><td>33CUNPP2274E1ZJ</td></tr>
            <tr><td><strong>PAN No</strong></td><td>CUNPP2274E</td></tr>
            <tr><td><strong>Account No</strong></td><td>4650845110</td></tr>
            <tr><td><strong>IFSC Code</strong></td><td>KKBK0008525</td></tr>
            <tr><td><strong>Bank Name</strong></td><td>KOTAK MAHINDRA BANK</td></tr>
            <tr><td><strong>Bank Address</strong></td><td>WEST TAMBARAM</td></tr>
            <tr><td><strong>Posted By</strong></td><td>Jayanth</td></tr>
          </table>

          <p style="font-size: 12px; color: #777; margin-top: 20px;">
            This is a system-generated email. Please do not reply.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Indent created alert sent to:', email);
    return true;
  } catch (err) {
    console.error('Error sending mail:', err);
    return false;
  }
}

async function sendPoApproval(email,data) {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: 'PO Approvals',
    html: `
          <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
        <div style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e1e1; padding: 20px; margin: auto; border-radius: 8px;">
          <p>Dear PO Staff,</p>
          <p>PO Number OEC/2025/3684/813/splx is approved by Parthasarathy G</p>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">
            This is a system-generated email. Please do not reply.
          </p>
        </div>
      </div>
    `
  }
  
}

async function sendPoCreated(email,data) {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: 'PO Created',
    html: `
          <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
        <div style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e1e1; padding: 20px; margin: auto; border-radius: 8px;">
          <p>Dear Staff,</p>
          <p>This is to inform you that PO has been created for the indent id:1977 and it is waiting for admin approval</p>
          <p>PO Number:OEC/2025/3689/813/splx </p>
          <p style="font-size: 12px; color: #777; margin-top: 20px;">
            This is a system-generated email. Please do not reply.
          </p>
        </div>
      </div>
    `
  }
  
}



module.exports={sendVendorCreated,sendFundCheckAlert,sendIndentApprovalAlert,notifyIndenter,sendndentCreated}