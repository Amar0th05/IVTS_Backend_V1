const {sql,getPool} = require('../config/dbconfig');
let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

// get all Assets details

// laptops
async function getAllLaptops(req, res) {
  try {
    console.log("enter");
    const request = pool.request();

    const query = `
      SELECT
        [Sl_No] AS slNo,
        [Asset_ID] AS assetId,
        [Category] AS category,
        [Model_No] AS modelNo,
        [Serial_No] AS serialNo,
        [Processor_Type] AS processorType,
        [RAM_GB] AS ramGb,
        [Storage_GB_TB] AS storage,
        [Graphics] AS graphics,
        [OS_Type] AS osType,
        [Host_Name] AS hostName,
        [IP_Address] AS ipAddress,
        [MAC_Address] AS macAddress,
        [Project_No] AS projectNo,
        [PO_No] AS poNo,
        [PO_Date] AS poDate,
        [Vendor_Name] AS vendorName,
        [Invoice_No] AS invoiceNo,
        [Invoice_Date] AS invoiceDate,
        [SRB_No] AS srbNo,
        [User_Name] AS userName,
        [Dept] AS dept,
        [Remarks] AS remarks,
        [Created_At] AS createdAt,
        [Updated_At] AS updatedAt,
        [status] AS status
      FROM [IVTS_MANAGEMENT].[dbo].[assets];
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      console.log("assets",result.recordset)
      return res.json({ laptops: result.recordset });
    } else {
      return res.status(404).json({ message: "No asset records found" });
    }
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}

async function addLaptops(req, res) {
  const { data } = req.body;
  console.log("laptop",data);

  console.log("Data received in backend:", data);

  if (!data) {
    return res.status(400).json({ message: "No data provided" });
  }

let storage = Number(data.HDD_GB_TB) || 0;   // ensure number
let unit = data.storageUnit || "GB";         // default GB
let GB = unit === "TB" ? storage * 1024 : storage;


  try {
    const request = pool.request();

    // Map inputs to match your `assets` table
    // request.input('assetId', sql.NVarChar, data.assetId);
    request.input('category', sql.NVarChar, "Laptop");
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('processorType', sql.NVarChar, data.Processor_Type);
    request.input('ram', sql.NVarChar, data.RAM_GB);
    request.input('storage', sql.Int, GB);
    request.input('graphics', sql.NVarChar, data.Graphics);
    request.input('osType', sql.NVarChar, data.OS_Type);
    request.input('hostName', sql.NVarChar, data.Host_Name);
    request.input('ipAddress', sql.NVarChar, data.IP_Address);
    request.input('macAddress', sql.NVarChar, data.MAC_Address);
    // request.input('port', sql.NVarChar, data.port );
    // request.input('remarkConfig', sql.NVarChar, data.remarkConfig);
    request.input('projectNo', sql.NVarChar, data.Project_No);
    request.input('poNo', sql.NVarChar, data.PO_No);
    request.input('poDate', sql.Date, data.PO_Date);
    request.input('vendorName', sql.NVarChar, data.Vendor_Name);
    request.input('invoiceNo', sql.NVarChar, data.Invoice_No);
    request.input('invoiceDate', sql.Date, data.Invoice_Date);
    request.input('srbNo', sql.NVarChar, data.SRB);
    request.input('userName', sql.NVarChar, data.userName);
    request.input('dept', sql.NVarChar, data.Dept);
    request.input('remarks', sql.NVarChar, data.Remarks);

    const query = `
      INSERT INTO assets (
        Category,
        Model_No,
        Serial_No,
        Processor_Type,
        RAM_GB,
        Storage_GB_TB,
        Graphics,
        OS_Type,
        Host_Name,
        IP_Address,
        MAC_Address,
        Project_No,
        PO_No,
        PO_Date,
        Vendor_Name,
        Invoice_No,
        Invoice_Date,
        SRB_No,
        User_Name,
        Dept,
        Remarks
      )
      VALUES (
        @category,
        @modelNo,
        @serialNo,
        @processorType,
        @ram,
        @storage,
        @graphics,
        @osType,
        @hostName,
        @ipAddress,
        @macAddress,
        @projectNo,
        @poNo,
        @poDate,
        @vendorName,
        @invoiceNo,
        @invoiceDate,
        @srbNo,
        @userName,
        @dept,
        @remarks
      )
    `;

    await request.query(query);

    res.json({ message: "Asset inserted successfully" });
  } catch (err) {
    res.status(500).json({ message: err?.message || "Internal Server Error" });
  }
}

// update status
async function toggleLaptopStatus(req, res) {
    try {
        const {id}= req.params;
        const request = await pool.request();

        // console.log(id);
        request.input("id", sql.NVarChar(20), id);

        const result = await request.query(`
            UPDATE assets
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE Asset_ID = @id
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


async function getAllAssets(req, res) {
  try {
    console.log("enter");
    const request = pool.request();

    const query = `
      SELECT
        [Sl_No] AS slNo,
        [Asset_ID] AS assetId,
        [Category] AS category,
        [Model_No] AS modelNo,
        [Serial_No] AS serialNo,
        [Processor_Type] AS processorType,
        [RAM_GB] AS ramGb,
        [Storage_GB_TB] AS storage,
        [Graphics] AS graphics,
        [OS_Type] AS osType,
        [Host_Name] AS hostName,
        [IP_Address] AS ipAddress,
        [MAC_Address] AS macAddress,
        [Port] AS port,
        [Remark_Config] AS remarkConfig,
        [Project_No] AS projectNo,
        [PO_No] AS poNo,
        [PO_Date] AS poDate,
        [Vendor_Name] AS vendorName,
        [Invoice_No] AS invoiceNo,
        [Invoice_Date] AS invoiceDate,
        [SRB_No] AS srbNo,
        [User_Name] AS userName,
        [Dept] AS dept,
        [Remarks] AS remarks,
        [Created_At] AS createdAt,
        [Updated_At] AS updatedAt,
        [status] AS status
      FROM [IVTS_MANAGEMENT].[dbo].[assets];
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      console.log("assets",result.recordset)
      return res.json({ assets: result.recordset });
    } else {
      return res.status(404).json({ message: "No asset records found" });
    }
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}


// get Assets by id
async function getAssets(req, res) {
  try {
    const id= req.params.id;
    console.log("ids",id);
    const request = pool.request();

    request.input('id',sql.NVarChar(50),id);

    const query = `
      SELECT
        [Sl_No] AS slNo,
        [Asset_ID] AS assetId,
        [Category] AS category,
        [Model_No] AS modelNo,
        [Serial_No] AS serialNo,
        [Processor_Type] AS processorType,
        [RAM_GB] AS ramGb,
        [Storage_GB_TB] AS storage,
        [Graphics] AS graphics,
        [OS_Type] AS osType,
        [Host_Name] AS hostName,
        [IP_Address] AS ipAddress,
        [MAC_Address] AS macAddress,
        [Port] AS port,
        [Remark_Config] AS remarkConfig,
        [Project_No] AS projectNo,
        [PO_No] AS poNo,
        [PO_Date] AS poDate,
        [Vendor_Name] AS vendorName,
        [Invoice_No] AS invoiceNo,
        [Invoice_Date] AS invoiceDate,
        [SRB_No] AS srbNo,
        [User_Name] AS userName,
        [Dept] AS dept,
        [Remarks] AS remarks,
        [Created_At] AS createdAt,
        [Updated_At] AS updatedAt
      FROM [IVTS_MANAGEMENT].[dbo].[assets] WHERE Asset_ID=@id;
    `;

    

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ assets: result.recordset[0]});
    } else {
      return res.status(404).json({ message: "No records found" });
    }
  } catch (err) {
    console.error("Error fetching Assets details:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}

// get all staff
async function getStaff(req, res) {
  console.log("getstaff enter");
  try {
    // ✅ SQL Server query to fetch all staff
    const result = await pool.request().query(`
      SELECT 
        Employee_ID_if_already_assigned AS id,
        Staff_Name AS name
      FROM dbo.Staffs
      ORDER BY Employee_ID_if_already_assigned ASC
    `);

    res.json({staffid:result.recordset});
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Server error" });
  }
}


module.exports={getAllLaptops,getAssets,getStaff,addLaptops,toggleLaptopStatus};