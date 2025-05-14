const {sql,getPool} = require('../config/dbconfig')
const {request} = require("express");

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('error getting pool (organizationController) : ', err);
    }
})();

async function getAllActiveVendors(req,res){

    try{

        let request=await pool.request();

        let query=`
        
                                SELECT * FROM mmt_vendors
                                where Status=1;
        `;

        let result= await request.query(query);
        return res.status(200).json({vendors:result.recordset||[]});

    }catch(err){
        console.error('VENDORS CONTROLLER : ', err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });

    }

}

async function getAllVendors(req,res){
    try{
        let request=await pool.request();
        let query=`
        
        SELECT * FROM mmt_vendors`;
        let result= await request.query(query);
        return res.status(200).json({vendors:result.recordset||[]});

    }catch(err){
        console.error('VENDORS CONTROLLER : ', err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function getVendorByID(id){
    try{
        let request=await pool.request();
        request.input('id',id);
        let result =await request.query(`select * from mmt_vendors where VendorID=@id`);
        return result.recordset[0]||null;
    }catch(err){
        console.error('VENDORS CONTROLLER : ', err);
    }
}


async function createVendor(req, res) {
    try {
        let data = req.body;
        console.log({ data });

        if (!data) {
            return res.status(400).json({ message: 'No Data Found to Create Vendor' });
        }

        let requiredFields = [
            "VendorName", "VendorAddress", "VendorPhone", "VendorMailAddress",
            "VendorGST", "VendorAccountNumber", "VendorIFSC",
            "VendorBank", "VendorBranch"
        ];

        for (let field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({
                    message: `Missing Required Field: ${field.replace(/([A-Z])/g, ' $1').trim()}`
                });
            }
        }
        let request = await pool.request();
        request
            .input('VendorName', data.VendorName)
            .input('VendorAddress', data.VendorAddress)
            .input('VendorPhone', data.VendorPhone)
            .input('VendorMailAddress', data.VendorMailAddress)
            .input('VendorGST', data.VendorGST)
            .input('VendorPAN', data.VendorPAN || null)
            .input('VendorAccountNumber', data.VendorAccountNumber)
            .input('VendorIFSC', data.VendorIFSC)
            .input('VendorBank', data.VendorBank)
            .input('VendorBranch', data.VendorBranch);

        let query = `
            INSERT INTO mmt_vendors
            (VendorName, Address, Phone, Email, GSTNo, PANNo, AccountNo, IFSCode, BankName, Branch)
            VALUES
                (@VendorName, @VendorAddress, @VendorPhone, @VendorMailAddress,
                 @VendorGST, @VendorPAN, @VendorAccountNumber, @VendorIFSC,
                 @VendorBank, @VendorBranch);
        `;

        let result = await request.query(query);

        if (result.rowsAffected[0] > 0) {
            return res.status(200).json({ message: "Vendor Created Successfully" });
        }

        return res.status(500).json({ message: "Something went wrong" });

    } catch (err) {
        console.log("Error in vendors controller", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


module.exports= {
    getAllActiveVendors,
    getAllVendors,
    getVendorByID,
    createVendor,
};