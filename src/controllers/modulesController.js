const {sql,getPool} = require('../config/dbconfig');
const res = require("express/lib/response");


let pool;
(async ()=>{
    pool=await getPool();
})();

async function getAllModules(req,res){
    try{
        const request=await pool.request();
        const query = `select ID as id,Name as name from mmt_modules WHERE ID NOT IN (8,9);`;

        const result=await request.query(query);

        if(result.recordset.length>0){
            return res.status(200).json({modules:result.recordset});

        }

        return res.status(404).json({error:"No modules found"});
    }catch(err){
        console.error('Error while getting modules',err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

module.exports = {getAllModules}