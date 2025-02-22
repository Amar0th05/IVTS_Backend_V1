const { sql,getPool, connectToDB } = require("../config/dbconfig");
const Designation = require("../models/Designation.js");

let pool;

(
    async ()=>{
        try{
            pool=await getPool();

        }catch(error){
            console.error("connection error: ",error);
        }
    }
)();

async function getAllDesignations(req,res){
    try{
        const request=await pool.request();
        const result=await request.query(`SELECT * FROM mmt_designation`);
        if(result.recordset.length===0){
            return res.status(404).json({message:"No designations found"});
        }
        let designations=[];
        result.recordset.map(data=>{
            designations.push({
                designationID:data.des_id,
                designation:data.designation,
                status:data.status,
                createdOn:data.created_on,
            })
        });
        return res.status(200).json({designations});
    }catch(err){
        console.error("Error fetching designations:",err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}




async function getDesignationById(req, res) {
    try {
        const { id } = req.params;



        const request = pool.request();

        
        request.input('des_id', sql.Int, id);

       
        const result = await request.query(`SELECT * FROM mmt_designation WHERE des_id=@des_id`);

        if (result.recordset.length > 0) {
            const data = new Designation(
                result.recordset[0].des_id,
                result.recordset[0].designation,
                result.recordset[0].created_on,
                result.recordset[0].status
            );
            res.json(data);
        } else {
            res.status(404).json({ message: "Designation not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


async function toggleStatus(req,res){
    try{
        const {id}=req.params;
        const request=pool.request();
        request.input('des_id',sql.Int,id);
        
        const result=await request.query(`UPDATE mmt_designation SET status = CASE 
            WHEN status=1 THEN 0
            ELSE 1 END
            WHERE des_id=@des_id`);

            if(result.rowsAffected>0){
                res.json({message:'status toggled successfully'});
            }else{
                res.status(404).json({message:'designation not found'});
            }
    }catch(err){
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function updateDesignation(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const request = pool.request();

        request.input('des_id',sql.Int,id);
        request.input('name',sql.NVarChar(50),name);

        const result = await request.query(`UPDATE mmt_designation SET designation=@name WHERE des_id=@des_id`);
        if (result.rowsAffected > 0) {
            res.json({ message: "Designation updated successfully" });
        } else {
            res.status(404).json({ message: "Designation not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function createDesignation(req, res) {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Designation name is required" });
        }

        const cleanName = name.trim();

        const request = pool.request();

        request.input('name',sql.NVarChar(50),cleanName)

        const result = await request.query(`
            INSERT INTO mmt_designation (designation, status)
            OUTPUT INSERTED.des_id, INSERTED.designation, INSERTED.status, INSERTED.created_on 
            VALUES (@name, 1);
        `);

        if (result.recordset.length > 0) {
            const { des_id, designation, status, created_on } = result.recordset[0];
            const newDesignation = new Designation(des_id, designation, created_on, status);
            res.status(201).json(newDesignation);
        } else {
            res.status(500).json({ message: "Failed to create designation" });
        }
    } catch (err) {
        console.error("Error in createDesignation:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getAllActiveDesignations(req, res) {
    try {

        const request = pool.request();

        const result = await request.query`SELECT des_id,designation FROM mmt_designation WHERE status=1`;
        if(result.recordset.length > 0) {
            return res.json({designations: result.recordset});
        }

        return res.status(404).json({ message: "Designation not found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


module.exports = {
    getAllDesignations,
    getDesignationById,
    toggleStatus,
    createDesignation,
    getAllActiveDesignations,
    updateDesignation
};