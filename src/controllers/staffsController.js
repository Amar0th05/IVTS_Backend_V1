const {sql,getPool} = require('../config/dbconfig');
let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

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
        [Emergency_Contact_Number] AS emergencyContactNumber
      FROM [IVTS_MANAGEMENT].[dbo].[Staffs];
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

async function addStaffs(req,res){

  const data=req.body;

  console.log("Data received in backend:",data);

  if(!data){
    return res.status(400).json({message:"No data provided"});
  }

  try{

    const request=pool.request();
    request.input('employeeId',sql.NVarChar,data.staffName);

  }catch(err){

  }


}


module.exports={getAllStaffs,addStaffs};