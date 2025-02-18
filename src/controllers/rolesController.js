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
        return res.status(500).json({error:"Internal Server Error"});
    }
}

module.exports={
    getAllRoles,
}