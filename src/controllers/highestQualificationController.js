const {sql,getPool} = require('../config/dbconfig')

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

async function getActiveHigestQualifications(req, res) {
    try {
        const pool = await getPool(req);

        const query = `SELECT qual_id,highest_qualification FROM mmt_highest_qualification WHERE status=1;;`;
        const result = await pool.query(query);

        if (result.recordset.length > 0) {

            return res.status(200).json({ highestQualifications: result.recordset });
        } else {
            return res.status(404).json({ error: "No highest qualifications found" });
        }
    } catch (error) {
        console.error("Error fetching highest qualifcations:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


module.exports={
    getActiveHigestQualifications,
}