const {sql,getPool} = require('../config/dbconfig');
const res = require("express/lib/response");


let pool;
(async ()=>{
    pool=await getPool();
})();

async function getAllRoles(req,res){
    try{
        const request=await pool.request();
        const query = `SELECT role_id AS roleID,role FROM mmt_user_roles ORDER BY role_id;`;

        const result=await request.query(query);

        if(result.recordset.length>0){
            return res.status(200).json({roles:result.recordset});

        }

        return res.status(404).json({error:"No roles found"});
    }catch(err){
        console.error('Error while getting roles',err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function createRole(req, res) {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Role is required" });
        }

        const cleanName = name.trim();

        const request = pool.request();

        request.input('name',sql.NVarChar(20),cleanName)

        const query=`
                            INSERT INTO mmt_user_roles
                            (role) VALUES (@name);
                
        `;

        const result = await request.query(query);
        if (result.rowsAffected>0){
            return res.status(200).json({message:"Role added successfully"});
        }
        return res.status(403).json({ error: "can't add Role" });
    } catch (err) {
        console.error("Error in createRole:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}
async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const request = pool.request();

        request.input('id',sql.Int,id);
        request.input('name',sql.NVarChar,name);

        if(!name || name.trim() === ""){
            return res.status(400).json({ message: "Role is required" });
        }
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "Role id is invalid" });
        }

        const result = await request.query(`UPDATE mmt_user_roles SET role=@name WHERE role_id=@id`);
        if (result.rowsAffected > 0) {
            return res.json({ message: "Role updated successfully" });
        }
        return res.status(404).json({ message: "Role not found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getRoleById(req, res) {
    try{
        const request = pool.request();
        const id = req.params.id;
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "id is required" });
        }

        request.input('id',sql.Int,id);

        const query=`SELECT * FROM mmt_user_roles WHERE role_id=@id`;
        const result = await request.query(query);

        if(result.recordset.length===0){
            return res.status(404).json({message:"Role not found"});
        }
        return res.status(200).json({
            role:{
                roleID:result.recordset[0].role_id,
                role:result.recordset[0].role
            }
        });

    }catch(err){
        console.error("Error in getRoleById:", err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

module.exports={
    getAllRoles,
    updateRole,
    createRole,
    getRoleById,
}