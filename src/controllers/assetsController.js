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
      FROM [IVTS_MANAGEMENT].[dbo].[assets]
      where Category='laptop';
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
async function updateLaptops(req, res) {
  const { data } = req.body;
  console.log("Laptop data received in backend:", data);

  if (!data || !data.Asset_ID) {
    return res.status(400).json({ message: "No assetId or data provided" });
  }

  let storage = Number(data.HDD_GB_TB) || 0;   // ensure number
  let unit = data.storageUnit || "GB";         // default GB
  let GB = unit === "TB" ? storage * 1024 : storage;

  try {
    const request = pool.request();
    console.log("assetId",data.Asset_ID);

    // Bind parameters
    request.input('assetId', sql.NVarChar, data.Asset_ID);
    request.input('category', sql.NVarChar, "Laptop");
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('processorType', sql.NVarChar, data.Processor_Type);
    request.input('ram', sql.NVarChar, data.RAM_GB);
    request.input('storage', sql.Int, data.GB);
    request.input('graphics', sql.NVarChar, data.Graphics);
    request.input('osType', sql.NVarChar, data.OS_Type);
    request.input('hostName', sql.NVarChar, data.Host_Name);
    request.input('ipAddress', sql.NVarChar, data.IP_Address);
    request.input('macAddress', sql.NVarChar, data.MAC_Address);
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
      UPDATE assets
      SET
        Category = @category,
        Model_No = @modelNo,
        Serial_No = @serialNo,
        Processor_Type = @processorType,
        RAM_GB = @ram,
        Storage_GB_TB = @storage,
        Graphics = @graphics,
        OS_Type = @osType,
        Host_Name = @hostName,
        IP_Address = @ipAddress,
        MAC_Address = @macAddress,
        Project_No = @projectNo,
        PO_No = @poNo,
        PO_Date = @poDate,
        Vendor_Name = @vendorName,
        Invoice_No = @invoiceNo,
        Invoice_Date = @invoiceDate,
        SRB_No = @srbNo,
        User_Name = @userName,
        Dept = @dept,
        Remarks = @remarks
      WHERE Asset_ID = @assetId
    `;
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset updated successfully" });
  } catch (err) {
    console.error("Error updating asset:", err);
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


// desktop
async function getAllDesktop(req, res) {
  try {
    console.log("enter");
    const request = pool.request();

    const query = `
      SELECT
        [Sl_No] AS slNo,
     [Asset_ID] AS assetId,
      [Category] As category,
        [Model_No] AS modelNo,
        [Serial_No] AS serialNo,
        [Processor_Type] AS processorType,
        [RAM_GB] AS ramGb,
        [Storage_GB_TB] AS storage,
        [OS_Type] AS osType,
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
        [status] AS status
      FROM [IVTS_MANAGEMENT].[dbo].[assets]
      WHERE Category='desktop';
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      console.log("assets",result.recordset)
      return res.json({ desktops: result.recordset });
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
async function addDesktop(req, res) {
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
    request.input('category', sql.NVarChar, "Desktop");
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('processorType', sql.NVarChar, data.Processor_Type);
    request.input('ram', sql.NVarChar, data.RAM_GB);
    request.input('storage', sql.Int, GB);
    request.input('osType', sql.NVarChar, data.OS_Type);
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
        OS_Type,
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
        @osType,
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
async function toggleDesktopStatus(req, res) {
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

async function updateDesktops(req, res) {
  const { data } = req.body;
  console.log("Desktop data received in backend:", data);

  if (!data || !data.Asset_ID) {
    return res.status(400).json({ message: "No assetId or data provided" });
  }

  let storage = Number(data.HDD_GB_TB) || 0;   // ensure number
  let unit = data.storageUnit || "GB";         // default GB
  let GB = unit === "TB" ? storage * 1024 : storage;

  try {
    const request = pool.request();
    console.log("assetId",data.Asset_ID);

    // Bind parameters
    request.input('assetId', sql.NVarChar, data.Asset_ID);
    request.input('category', sql.NVarChar, "Desktop");
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('processorType', sql.NVarChar, data.Processor_Type);
    request.input('ram', sql.NVarChar, data.RAM_GB);
    request.input('storage', sql.Int, data.GB);
    request.input('osType', sql.NVarChar, data.OS_Type);
    request.input('ipAddress', sql.NVarChar, data.IP_Address);
    request.input('macAddress', sql.NVarChar, data.MAC_Address);
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
      UPDATE assets
      SET
        Category = @category,
        Model_No = @modelNo,
        Serial_No = @serialNo,
        Processor_Type = @processorType,
        RAM_GB = @ram,
        Storage_GB_TB = @storage,
        OS_Type = @osType,
        IP_Address = @ipAddress,
        MAC_Address = @macAddress,
        Project_No = @projectNo,
        PO_No = @poNo,
        PO_Date = @poDate,
        Vendor_Name = @vendorName,
        Invoice_No = @invoiceNo,
        Invoice_Date = @invoiceDate,
        SRB_No = @srbNo,
        User_Name = @userName,
        Dept = @dept,
        Remarks = @remarks
      WHERE Asset_ID = @assetId
    `;
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset updated successfully" });
  } catch (err) {
    console.error("Error updating asset:", err);
    res.status(500).json({ message: err?.message || "Internal Server Error" });
  }
}

// server
async function getAllServer(req, res) {
  try {
    console.log("enter");
    const request = pool.request();

    const query = `
      SELECT
        [Sl_No] AS slNo,
        [Model_No] AS modelNo,
        [Serial_No] AS serialNo,
        [Asset_ID] AS assetId,
        [Category] AS category,
        [IP_Address] AS ipAddress,
        [MAC_Address] AS macAddress,
        [port] AS port,
        [Remark_Config] AS remarkConfig,
        [Project_No] AS projectNo,
        [PO_No] AS poNo,
        [PO_Date] AS poDate,
        [Vendor_Name] AS vendorName,
        [Invoice_No] AS invoiceNo,
        [Invoice_Date] AS invoiceDate,
        [SRB_No] AS srbNo,
        [Dept] AS dept,
        [User_Name] AS userName,
        [Remarks] AS remarks,
        [status] AS status
      FROM [IVTS_MANAGEMENT].[dbo].[assets]
      WHERE Category='server';
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      console.log("assets",result.recordset)
      return res.json({servers: result.recordset });
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
async function addServer(req, res) {
  const { data } = req.body;
  console.log("laptop",data);

  console.log("Data received in backend:", data);

  if (!data) {
    return res.status(400).json({ message: "No data provided" });
  }

  try {
    const request = pool.request();

    // Map inputs to match your `assets` table
    // request.input('assetId', sql.NVarChar, data.assetId);
    request.input('category', sql.NVarChar, "server");
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('ipAddress', sql.NVarChar, data.IP_Address);
    request.input('macAddress', sql.NVarChar, data.MAC_Address);
    request.input('port', sql.NVarChar, data.Port );
    request.input('remarkConfig', sql.NVarChar, data.Remark_Config);
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
        IP_Address,
        MAC_Address,
        Port,
        Remark_Config,
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
        @ipAddress,
        @macAddress,
        @port,
        @remarkConfig,
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
async function toggleServerStatus(req, res) {
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
async function updateServer(req, res) {
  const { data } = req.body;
  console.log("Server data received in backend:", data);

  if (!data || !data.Asset_ID) {
    return res.status(400).json({ message: "No assetId or data provided" });
  }

  try {
    const request = pool.request();
    console.log("assetId",data.Asset_ID);

    // Bind parameters
    request.input('assetId', sql.NVarChar, data.Asset_ID);
    request.input('modelNo', sql.NVarChar, data.Model_No);
    request.input('serialNo', sql.NVarChar, data.Serial_No);
    request.input('ipAddress', sql.NVarChar, data.IP_Address);
    request.input('macAddress', sql.NVarChar, data.MAC_Address);
    request.input('port', sql.NVarChar, data.Port );
    request.input('remarkConfig', sql.NVarChar, data.Remark_Config);
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
      UPDATE assets
      SET
        Model_No = @modelNo,
        Serial_No = @serialNo,
        IP_Address = @ipAddress,
        MAC_Address = @macAddress,
        Port = @port,
        Remark_Config = @remarkConfig,
        Project_No = @projectNo,
        PO_No = @poNo,
        PO_Date = @poDate,
        Vendor_Name = @vendorName,
        Invoice_No = @invoiceNo,
        Invoice_Date = @invoiceDate,
        SRB_No = @srbNo,
        User_Name = @userName,
        Dept = @dept,
        Remarks = @remarks
      WHERE Asset_ID = @assetId
    `;
    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset updated successfully" });
  } catch (err) {
    console.error("Error updating asset:", err);
    res.status(500).json({ message: err?.message || "Internal Server Error" });
  }
}

module.exports={getAllLaptops,getAssets,getStaff,updateLaptops,updateServer,addLaptops,toggleLaptopStatus,getAllDesktop,addDesktop,toggleDesktopStatus,getAllServer,addServer,toggleServerStatus,updateDesktops};