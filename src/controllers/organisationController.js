const {sql,getPool} = require('../config/dbconfig')

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('error getting pool (organizationController) : ', err);
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
    } catch (err) {
        console.error("Error fetching organisations:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getAllOrganisations(req,res){
    try{
        const request=await pool.request();
        const query=`
                            SELECT * FROM mmt_organisation;
            
        `;

        const result = await request.query(query);

        let organisations = [];

        if (result.recordset.length > 0) {
            const data=result.recordset;

            data.map((organisation)=>{
                organisations.push({
                    orgID:organisation.org_id,
                    organisation:organisation.organisation_name,
                    status:organisation.status,
                    createdOn:organisation.created_on,
                })
            });

            return res.status(200).json({ organisations: organisations });
        }

        return res.status(404).json({ error: "No organisations found" });
    }catch(err){
        console.error("Error getting organisations:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function toggleStatus(req,res){
    try{
        const {id}=req.params;
        const request=pool.request();
        request.input('id',sql.Int,id);

        const result=await request.query(`UPDATE mmt_organisation SET status = CASE 
            WHEN status=1 THEN 0
            ELSE 1 END
            WHERE org_id=@id`);

        if(result.rowsAffected>0){
            res.json({message:'status toggled successfully'});
        }else{
            res.status(404).json({message:'organisation not found'});
        }
    }catch(err){
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function getOrganisationById(req, res) {
    try {
        const { id } = req.params;

        const request = pool.request();


        request.input('id', sql.Int, id);


        const result = await request.query(`SELECT * FROM mmt_organisation WHERE org_id=@id`);

        let organisation;

        if(result.recordset.length>0){
            const data=result.recordset[0];

            organisation = {
                orgID:data.org_id,
                organisation:data.organisation_name,
                status:data.status,
                createdOn:data.created_on,

            }
            return res.status(200).json({organisation});
        }

        return res.status(404).json({ error: "No organisations found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}


async function createOrganisation(req, res) {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Organisation name is required" });
        }

        const cleanName = name.trim();

        const request = pool.request();

        request.input('name',sql.NVarChar(20),cleanName)
        request.input('date',sql.Date,new Date());

        const query=`
                            INSERT INTO mmt_organisation
                            (organisation_name,status,created_on) VALUES (@name,1,@date);
                
        `;

        const result = await request.query(query);
        if (result.rowsAffected>0){
            return res.status(200).json({message:"Organisation added successfully"});
        }
        return res.status(403).json({ error: "can't  add organisation" });
    } catch (err) {
        console.error("Error in createOrganisation:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function updateOrganisation(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const request = pool.request();

        request.input('id',sql.Int,id);
        request.input('name',sql.NVarChar,name);

        if(!name || name.trim() === ""){
            return res.status(400).json({ message: "Organisation name is required" });
        }
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "Organisation id is invalid" });
        }

        const result = await request.query(`UPDATE mmt_organisation SET organisation_name=@name WHERE org_id=@id`);
        if (result.rowsAffected > 0) {
            return res.json({ message: "Organisation updated successfully" });
        }
        return res.status(404).json({ message: "Organisation not found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getAllOrganisationsExceptHQ(req,res){
    try {
        const request = await pool.request();

        const query = `SELECT org_id,organisation_name FROM mmt_organisation WHERE status=1 AND org_id!=1;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {

            return res.status(200).json({ organisations: result.recordset });
        } else {
            return res.status(404).json({ error: "No organisations found" });
        }
    } catch (err) {
        console.error("Error fetching organisations:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

module.exports = {
    getActiveOrganisations,
    getAllOrganisations,
    toggleStatus,
    getOrganisationById,
    createOrganisation,
    updateOrganisation,
    getAllOrganisationsExceptHQ
}