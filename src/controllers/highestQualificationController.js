const {sql,getPool} = require('../config/dbconfig')
const Designation = require("../models/Designation");

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

async function getActiveHighestQualifications(req, res) {
    try {
        const request = await pool.request();

        const query = `SELECT qual_id,highest_qualification FROM mmt_highest_qualification WHERE status=1;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {

            return res.status(200).json({ highestQualifications: result.recordset });
        } else {
            return res.status(404).json({ error: "No highest qualifications found" });
        }
    } catch (err) {
        console.error("Error fetching highest qualifications:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


async function getAllHighestQualifications(req,res){
    try{
        const request = await pool.request();
        const query=`SELECT * FROM mmt_highest_qualification`;
        const result=await request.query(query);

        let highestQualifications =[];

        if(result.recordset.length > 0) {
            const data=result.recordset;
            data.map((qualification)=>{
                highestQualifications.push({
                    qualID:qualification.qual_id,
                    highestQualification:qualification.highest_qualification,
                    status:qualification.status,
                    createdOn:qualification.created_on,

                });
            });
            return res.status(200).json({highestQualifications});
        }
            return res.status(404).json({ error: "No highest qualifications found" });

    }catch(err){
        console.error("Error fetching highest qualifications:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function toggleStatus(req,res){
    try{
        const {id}=req.params;
        const request=pool.request();
        request.input('id',sql.Int,id);

        const result=await request.query(`UPDATE mmt_highest_qualification SET status = CASE 
            WHEN status=1 THEN 0
            ELSE 1 END
            WHERE qual_id=@id`);

        if(result.rowsAffected>0){
            res.json({message:'status toggled successfully'});
        }else{
            res.status(404).json({message:'qualification not found'});
        }
    }catch(err){
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getQualificationById(req, res) {
    try {
        const { id } = req.params;

        const request = pool.request();


        request.input('id', sql.Int, id);


        const result = await request.query(`SELECT * FROM mmt_highest_qualification WHERE qual_id=@id`);

        let highestQualification;

        if(result.recordset.length>0){
            const data=result.recordset[0];

            highestQualification = {
                qualID:data.qual_id,
                highestQualification:data.highest_qualification,
                status:data.status,
                createdOn:data.created_on,

            }
            return res.status(200).json({highestQualification});
        }

        return res.status(404).json({ error: "No highest qualifications found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function createQualification(req, res) {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Qualification name is required" });
        }

        const cleanName = name.trim();

        const request = pool.request();

        request.input('name',sql.NVarChar(20),cleanName)

        const query=`
                            INSERT INTO mmt_highest_qualification
                            (highest_qualification,status) VALUES (@name,1);
                
        `;

        const result = await request.query(query);
        if (result.rowsAffected>0){
            return res.status(200).json({message:"Qualification created successfully"});
        }
        return res.status(403).json({ error: "can create qualification" });
    } catch (err) {
        console.error("Error in createDesignation:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function updateQualification(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const request = pool.request();

        request.input('id',sql.Int,id);
        request.input('name',sql.NVarChar(20),name);

        if(!name || name.trim() === ""){
            return res.status(400).json({ message: "Qualification name is required" });
        }
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "Qualification id is invalid" });
        }

        const result = await request.query(`UPDATE mmt_highest_qualification SET highest_qualification=@name WHERE qual_id=@id`);
        if (result.rowsAffected > 0) {
            return res.json({ message: "Qualification updated successfully" });
        }
            return res.status(404).json({ message: "Qualification not found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

module.exports={
    getActiveHighestQualifications,
    getAllHighestQualifications,
    toggleStatus,
    getQualificationById,
    createQualification,
    updateQualification,
}