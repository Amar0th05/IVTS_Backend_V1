const {sql,getPool} = require('../config/dbconfig')

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('error getting pool (organizatinController) : ', err);
    }
})();

async function getActiveOrganisations(req, res) {
    try {
        const request = await pool.request();

        const query = `SELECT org_id,organisation_name FROM mmt_organisation WHERE status=1;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {

            return res.status(200).json({ organisations: result.recordset });
        } else {
            return res.status(404).json({ error: "No organisations found" });
        }
    } catch (error) {
        console.error("Error fetching organisations:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    getActiveOrganisations
}