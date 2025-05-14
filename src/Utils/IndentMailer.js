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

const transporter=mailer.createTransport({
    service: 'hotmail',
    auth:{
        user:process.env.EMAIL_SENDER,
        pass:process.env.EMAIL_PASSWORD
    }
});

async function sendFCAlert(data){
    let mails = await getFundCheckMails();
    console.log(mails);
    await Promise.all(mails.map(mail => sendFundCheckAlert(mail.mail, data)));
}

async function sendIndentApprovalAlert(data){
    let mails = await getIndentApprovalMails();
    console.log(mails);
    await Promise.all(mails.map(mail => sendIndentApprovalNotification(mail.mail, data)));
}

async function sendFundCheckAlert(email, data) {
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: `Action Required – New Indent Created ${data.IndentID} – Update Fund Availability in Portal`,
        html: `
            Dear Sir / Madam, <br>
<br>
This is an automated notification to inform you that a new indent with ID <b>${data.IndentID}</b> has been created by <b>${data.CreatedBy}</b>. <br><br>
Please find the details below. <br>
<br>
Kindly update the fund availability status in the portal accordingly.
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
      <td style="border: 1px solid black; padding: 10px;">${item.productName}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.name}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.desc}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.classification}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.qty}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.price}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.estTotalPrice}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.remarks||''}</td>
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

async function notifyIndenter(email,data){


    const date = data.CreatedAt.toISOString().split('T')[0];


    const time = data.CreatedAt.toISOString().split('T')[1].substring(0, 5);

    const message = `This is an automated notification to inform you that your indent with ID <b>${data.IndentID}</b> has been created successfully on <b>${date}</b> at <b>${time}</b>.<br><br>`;


    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: email,
        subject: `Confirmation of Indent Creation – Indent ID ${data.IndentID} Successfully Generated`,
        html: `
            Dear Sir / Madam, <br>
<br>
${message}

<br><br>
Please find the details below.
<br><br>

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
      <td style="border: 1px solid black; padding: 10px;">${item.productName}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.name}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.desc}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.classification}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.qty}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.price}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.estTotalPrice}</td>
      <td style="border: 1px solid black; padding: 10px;">${item.remarks||''}</td>
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
</table>
<br><br>

<a style="color: white;background-color: rgb(7, 117, 212);border-radius: 5px;padding: 10px 20px 10px 20px;" href="${process.env.CLIENT_URL}">Go To Portal</a>
<br><br><p style="color: blue;">** Please keep the ID for your reference.</p><br><br><br>
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

module.exports={sendFCAlert,sendIndentApprovalAlert,notifyIndenter}