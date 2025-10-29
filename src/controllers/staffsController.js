const {sql,getPool} = require('../config/dbconfig');
let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

// get all staff details

async function getAllStaffs(req, res) {
  try {
    const request = pool.request();

    const query = `
      SELECT
        [Staff_Name] AS staffName,
        [Employee_ID_if_already_assigned] AS employeeId,
        [Date_of_Birth] AS dob,
        [Gender] AS gender,
        [Contact_Number] AS contactNumber,
        [Personal_Email_Address] AS personalEmail,
        [Permanent_Address] AS address,
        [Date_of_Joining] AS dateOfJoining,
        [Department] AS department,
        [Designation] AS designation,
        [Employment_Type] AS employmentType,
        [Reporting_Manager_Name] AS reportingManager,
        [Work_Location] AS workLocation,
        [Highest_Educational_Qualification] AS education,
        [Specialization] AS specialization,
        [Previous_Company] AS previousCompany,
        [Total_Years_of_Experience] AS experience,
        [LinkedIn_GitHub_Portfolio_Link] AS linkedin,
        [Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad] AS assets,
        [Official_Email_Address] AS officialEmail,
        [Emergency_Contact_Name] AS emergencyContactName,
        [Emergency_Contact_Number] AS emergencyContactNumber,
        [status] AS status
      FROM Staffs;
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ staffs: result.recordset });
    } else {
      return res.status(404).json({ message: "No records found" });
    }
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}

// get staff by id
async function getStaff(req, res) {
  try {
    const id= req.params.id;
    console.log("ids",id);
    const request = pool.request();

    request.input('id',sql.NVarChar(50),id);

    const query = `
      SELECT
        [Staff_Name] AS staffName,
        [Employee_ID_if_already_assigned] AS employeeId,
        [Date_of_Birth] AS dob,
        [Gender] AS gender,
        [Contact_Number] AS contactNumber,
        [Personal_Email_Address] AS personalEmail,
        [Permanent_Address] AS address,
        [Date_of_Joining] AS dateOfJoining,
        [Department] AS department,
        [Designation] AS designation,
        [Employment_Type] AS employmentType,
        [Reporting_Manager_Name] AS reportingManager,
        [Work_Location] AS workLocation,
        [Highest_Educational_Qualification] AS education,
        [Specialization] AS specialization,
        [Previous_Company] AS previousCompany,
        [Total_Years_of_Experience] AS experience,
        [LinkedIn_GitHub_Portfolio_Link] AS linkedin,
        [Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad] AS assets,
        [Official_Email_Address] AS officialEmail,
        [Emergency_Contact_Name] AS emergencyContactName,
        [Emergency_Contact_Number] AS emergencyContactNumber
      FROM Staffs WHERE Employee_ID_if_already_assigned=@id;
    `;

    

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      return res.json({ staffs: result.recordset[0]});
    } else {
      return res.status(404).json({ message: "No records found" });
    }
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}


async function addStaffs(req,res){

  const { data }=req.body;

  console.log("Data received in backend:",data);



  if(!data){
    return res.status(400).json({message:"No data provided"});
  }

  try{

    const request=pool.request();
    request.input('employeeId',sql.NVarChar,data.employeeId);
    request.input('staffName',sql.NVarChar,data.staffName);
    request.input('dob',sql.Date,data.dateOfBirth);
    request.input('gender',sql.NVarChar,data.gender);
    request.input('contactNumber',sql.NVarChar,data.contactNumber);
    request.input('personalEmail',sql.NVarChar,data.personalEmail);
    request.input('emergencyContactName',sql.NVarChar,data.emergencyContactName);
    request.input('emergencyContactNumber',sql.NVarChar,data.emergencyContactNumber);
    request.input('permanentAddress',sql.NVarChar,data.permanentAddress);
    request.input('dateOfJoining',sql.NVarChar,data.dateOfJoining);
    request.input('workLocation',sql.NVarChar,data.workLocation);
    request.input('department',sql.NVarChar,data.department);
    request.input('designation',sql.NVarChar,data.designation);
    request.input('employmentType',sql.NVarChar,data.employmentType);
    request.input('reportingManager',sql.NVarChar,data.reportingManager);
    request.input('highestQualification',sql.NVarChar,data.highestQualification);
    request.input('specialization',sql.NVarChar,data.specialization);
    request.input('previousCompany',sql.NVarChar,data.previousCompany);
    request.input('experience',sql.NVarChar,data.experience);
    request.input('portfolio',sql.NVarChar,data.portfolio);
    request.input('officeAssets',sql.NVarChar,data.officeAssets);
    request.input('officialEmail',sql.NVarChar,data.officialEmail);
    request.input('status',sql.Bit,1);

    const query = `INSERT INTO Staffs 
      ([Staff_Name],
       [Employee_ID_if_already_assigned],
       [Date_of_Birth],
       [Gender],
       [Contact_Number],
       [Personal_Email_Address],
       [Permanent_Address],
       [Date_of_Joining],
       [Department],
       [Designation],
       [Employment_Type],
       [Reporting_Manager_Name],
       [Work_Location],
       [Highest_Educational_Qualification],
       [Specialization],
       [Previous_Company],
       [Total_Years_of_Experience],
       [LinkedIn_GitHub_Portfolio_Link],
       [Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad],
       [Official_Email_Address],
       [Emergency_Contact_Name],
       [Emergency_Contact_Number],
       [status])
VALUES (@staffName,
        @employeeId,
        @dob,
        @gender,
        @contactNumber,
        @personalEmail,
        @permanentAddress,
        @dateOfJoining,
        @department,
        @designation,
        @employmentType,
        @reportingManager,
        @workLocation,
        @highestQualification,
        @specialization,
        @previousCompany,
        @experience,
        @portfolio,
        @officeAssets,
        @officialEmail,
        @emergencyContactName,
        @emergencyContactNumber,
        @status);
`;

      await request.query(query);

      res.json({ message: "Staffs inserted successfully" });
      }catch(err){

        res.status(500).json({message: err?.message || "Internal Server Error"});

  }


}

// update staff
async function updateStaffs(req,res) {

      try {
        const request = pool.request();
        const { data } = req.body;
        console.log("data",data);

  if (!data) return res.status(400).json({ message: 'No inputs found' });
        if (!data.employeeId) return res.status(400).json({ message: 'No ID found' });

        request.input('id', sql.NVarChar(20), data.employeeId);

        let updates = [];

        if (data.staffName !== undefined) {
            updates.push("Staff_Name = @Staff_Name");
            request.input('Staff_Name', sql.NVarChar(50), data.staffName);
        }

        if (data.employeeId !== undefined) {
            updates.push("Employee_ID_if_already_assigned = @Employee_ID_if_already_assigned");
            request.input('Employee_ID_if_already_assigned', sql.NVarChar(50), data.employeeId);
        }

        if (data.dateOfBirth !== undefined) {
            updates.push("Date_of_Birth = @Date_of_Birth");
            request.input('Date_of_Birth', sql.Date, data.dateOfBirth);
        }

        if (data.gender !== undefined) {
            updates.push("Gender = @Gender");
            request.input('Gender', sql.NVarChar, data.gender);
        }

        if (data.contactNumber !== undefined) {
            updates.push("Contact_Number = @Contact_Number");
            request.input('Contact_Number', sql.Numeric(10, 0), data.contactNumber);
        }

        if (data.personalEmail !== undefined) {
            updates.push("Personal_Email_Address = @Personal_Email_Address");
            request.input('Personal_Email_Address', sql.NVarChar(50), data.personalEmail);
        }

        if (data.permanentAddress !== undefined) {
            updates.push("Permanent_Address = @Permanent_Address");
            request.input('Permanent_Address', sql.NVarChar(150), data.permanentAddress);
        }

        if (data.dateOfJoining !== undefined) {
            updates.push("Date_of_Joining = @Date_of_Joining");
            request.input('Date_of_Joining', sql.Date, data.dateOfJoining);
        }

        if (data.department !== undefined) {
            updates.push("Department = @Department");
            request.input('Department', sql.NVarChar, data.department);
        }

        if (data.designation !== undefined) {
            updates.push("Designation = @Designation");
            request.input('Designation', sql.NVarChar(100), data.designation);
        }

        if (data.employmentType !== undefined) {
            updates.push("Employment_Type = @Employment_Type");
            request.input('Employment_Type', sql.NVarChar, data.employmentType);
        }

        if (data.reportingManager !== undefined) {
            updates.push("Reporting_Manager_Name = @Reporting_Manager_Name");
            request.input('Reporting_Manager_Name', sql.NVarChar(255), data.reportingManager);
        }

        if (data.workLocation !== undefined) {
            updates.push("Work_Location = @Work_Location");
            request.input('Work_Location', sql.NVarChar, data.workLocation);
        }

        if (data.highestQualification !== undefined) {
            updates.push("Highest_Educational_Qualification = @Highest_Educational_Qualification");
            request.input('Highest_Educational_Qualification', sql.NVarChar, data.highestQualification);
        }
        if (data.specialization !== undefined) {
            updates.push("Specialization = @Specialization");
            request.input('Specialization', sql.NVarChar, data.specialization);
        }
        if (data.Previous_Company !== undefined) {
            updates.push("Previous_Company = @Previous_Company");
            request.input('Previous_Company', sql.NVarChar, data.previousCompany);
        }
        if (data.experience !== undefined) {
            updates.push("Total_Years_of_Experience = @Total_Years_of_Experience");
            request.input('Total_Years_of_Experience', sql.NVarChar, data.experience);
        }
        if (data.portfolio !== undefined) {
            updates.push("LinkedIn_GitHub_Portfolio_Link = @LinkedIn_GitHub_Portfolio_Link");
            request.input('LinkedIn_GitHub_Portfolio_Link', sql.NVarChar, data.portfolio);
        }
        if (data.officeAssets !== undefined) {
            updates.push("Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad = @Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad");
            request.input('Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad', sql.NVarChar, data.officeAssets);
        }
        if (data.officialEmail !== undefined) {
            updates.push("Official_Email_Address = @Official_Email_Address");
            request.input('Official_Email_Address', sql.NVarChar, data.officialEmail);
        }
        if (data.Emergency_Contact_Name !== undefined) {
            updates.push("Emergency_Contact_Name = @Emergency_Contact_Name");
            request.input('Emergency_Contact_Name', sql.NVarChar, data.emergencyContactName);
        }
        if (data.Emergency_Contact_Number !== undefined) {
            updates.push("Emergency_Contact_Number = @Emergency_Contact_Number");
            request.input('Emergency_Contact_Number', sql.NVarChar, data.emergencyContactNumber);
        }

        // updates.push("status = @status");
        // request.input('status', sql.Bit, 1);

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        const query = `UPDATE Staffs SET ${updates.join(", ")} WHERE Employee_ID_if_already_assigned = @id`;

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

// update status
async function toggleIITStaffStatus(req, res) {
    try {
        const {id}= req.params;
        const request = await pool.request();

        // console.log(id);
        request.input("id", sql.NVarChar(20), id);

        const result = await request.query(`
            UPDATE Staffs
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE Employee_ID_if_already_assigned = @id
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

async function downloadAllIITStaff(req, res) {
    console.log("enter");

  try {
    const request = pool.request();

    const query = `
      SELECT
        [Staff_Name] AS staffName,
        [Employee_ID_if_already_assigned] AS employeeId,
        [Date_of_Birth] AS dob,
        [Gender] AS gender,
        [Contact_Number] AS contactNumber,
        [Personal_Email_Address] AS personalEmail,
        [Emergency_Contact_Name_Number] AS emergencyContactNameNumber,
        [Permanent_Address] AS address,
        [Date_of_Joining] AS dateOfJoining,
        [Department] AS department,
        [Designation] AS designation,
        [Employment_Type] AS employmentType,
        [Reporting_Manager_Name] AS reportingManager,
        [Work_Location] AS workLocation,
        [Highest_Educational_Qualification] AS education,
        [Specialization] AS specialization,
        [Previous_Company] AS previousCompany,
        [Total_Years_of_Experience] AS experience,
        [LinkedIn_GitHub_Portfolio_Link] AS linkedin,
        [Office_Asset_Register_with_description_ie_Laptop_Desktop_ipad] AS assets,
        [Official_Email_Address] AS officialEmail,
        [Emergency_Contact_Name] AS emergencyContactName,
        [Emergency_Contact_Number] AS emergencyContactNumber,
        [status] AS status
      FROM Staffs;
    `;

    const result = await request.query(query);

    console.log(result);

    if (result.recordset.length > 0) {
      return res.json({ staffs: result.recordset });
    } else {
      return res.status(404).json({ message: "No records found" });
    }
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).json({
      message:
        err.response?.data?.message ||
        err.message ||
        "Internal Server Error",
    });
  }
}


module.exports={getAllStaffs,addStaffs,getStaff,updateStaffs,toggleIITStaffStatus,downloadAllIITStaff};