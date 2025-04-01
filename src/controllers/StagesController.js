const { sql, getPool } = require('../config/dbconfig');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error('Error while getting pool in stages controller', err);
    }
})();


async function getActiveStages(req, res) {
    try {
        const request = await pool.request();
        const query = `SELECT stage_id, stage FROM mmt_stages WHERE status = 1;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ stages: result.recordset });
        } else {
            return res.status(404).json({ error: "No active stages found" });
        }
    } catch (err) {
        console.error("Error fetching active stages:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getAllStages(req, res) {
    try {
        const request = await pool.request();
        const query = `SELECT * FROM mmt_stages;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            const data = result.recordset;
            let stages = [];

            data.map(stage => {
                stages.push({
                    stageID: stage.stage_id,
                    stage: stage.stage,
                    status: stage.status,
                    createdOn: stage.created_on
                });
            });

            return res.status(200).json({ stages });
        }
        return res.status(404).json({ error: "No stages found" });
    } catch (err) {
        console.error('Error while getting stages', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getStageById(req, res) {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ error: "Stage ID is required" });
        }

        const request = await pool.request();
        request.input('id', sql.Int, id);

        const query = 'SELECT * FROM mmt_stages WHERE stage_id = @id';
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ stage: result.recordset[0] });
        }
        return res.status(404).json({ error: "Stage not found" });
    } catch (err) {
        console.error('Error while getting stage by ID', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function toggleStageStatus(req, res) {
    try {
        const id = req.params.id;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid stage ID" });
        }

        const request = await pool.request();
        request.input('id', sql.Int, id);

        const query = `
            UPDATE mmt_stages
            SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END
            WHERE stage_id = @id;
        `;

        const result = await request.query(query);

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: "Stage not found" });
        }
        return res.json({ message: "Stage status toggled successfully" });
    } catch (err) {
        console.error('Error while toggling stage status', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function createStage(req, res) {
    try {
        const stage = req.body.stage;

        if (!stage) {
            return res.status(400).json({ message: "Stage name is required" });
        }

        const request = await pool.request();
        request.input('stage', sql.NVarChar, stage);

        const query = `
            INSERT INTO mmt_stages (stage) VALUES (@stage);
        `;

        const result = await request.query(query);

        if (result.rowsAffected === 0) {
            return res.status(401).json({ message: "Stage not created" });
        }
        return res.json({ message: "Stage created successfully" });
    } catch (err) {
        console.error('Error while creating stage', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function updateStage(req, res) {
    try {
        const stage = req.body.stage;
        const id = req.params.id;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid stage ID" });
        }

        if (!stage) {
            return res.status(400).json({ message: "Stage name is required" });
        }

        const request = await pool.request();
        request.input('stage', sql.NVarChar, stage);
        request.input('id', sql.Int, id);

        const query = `
            UPDATE mmt_stages
            SET stage = @stage
            WHERE stage_id = @id;
        `;

        const result = await request.query(query);

        if (result.rowsAffected === 0) {
            return res.status(404).json({ message: "Stage not found" });
        }
        return res.json({ message: "Stage updated successfully" });
    } catch (err) {
        console.error('Error while updating stage', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getStageDataForOrganisation(req,res){
    try{
        const id=req.params.id;
        const request=await pool.request();
        request.input('id',id);
        const query=`
            SELECT
                s.stage AS stage,
                s.stage_id AS stageID,
                SUM(CASE WHEN e.equipment_category = 1 THEN 1 ELSE 0 END) AS v1,
                SUM(CASE WHEN e.equipment_category = 3 THEN 1 ELSE 0 END) AS v2,
                SUM(CASE WHEN e.equipment_category = 4 THEN 1 ELSE 0 END) AS v3,
                SUM(CASE WHEN e.equipment_category = 5 THEN 1 ELSE 0 END) AS v4
            FROM mmt_stages s
                     CROSS JOIN (
                SELECT DISTINCT o.organisation_name, o.org_id
                FROM mmt_organisation o
                         INNER JOIN tbl_equipments e ON o.org_id = e.port
                WHERE o.org_id = @id
            ) AS o
                     LEFT JOIN tbl_equipment_delivery d
                               ON s.stage_id = d.stage_id
                     LEFT JOIN tbl_equipments e
                               ON d.equipment_id = e.equipment_id
                                   AND e.port = o.org_id
            GROUP BY o.organisation_name, s.stage,s.stage_id
            ORDER BY o.organisation_name ASC, s.stage ASC;
        `;

        const result = await request.query(query);
        return res.json({ records:result.recordset||[] });

    }catch(err){
        console.log(err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

async function getStageDataForOrganisationWithCategory(req,res){
   try{
       const id=req.params.id;
       const request=await pool.request();
       request.input('id',id);
       const query=`
                            SELECT 
                            s.stage AS stage,
                            s.stage_id AS stageID,
                            SUM(CASE WHEN e.equipment_category = 1 THEN 1 ELSE 0 END) AS [VTMS_IT_EQUIPMENTS_AND_HARDWARE],
                            SUM(CASE WHEN e.equipment_category = 3 THEN 1 ELSE 0 END) AS [VTMS_SENSORS],
                            SUM(CASE WHEN e.equipment_category = 4 THEN 1 ELSE 0 END) AS [VTMS_CENTRE_SURVILLENCE],
                            SUM(CASE WHEN e.equipment_category = 5 THEN 1 ELSE 0 END) AS [VTMS_DISPLAY_WALL]
                        FROM mmt_stages s
                        CROSS JOIN (
                            SELECT DISTINCT o.organisation_name, o.org_id 
                            FROM mmt_organisation o
                            INNER JOIN tbl_equipments e ON o.org_id = e.port
                            WHERE o.org_id = @id
                        ) AS o
                        LEFT JOIN tbl_equipment_delivery d 
                            ON s.stage_id = d.stage_id
                        LEFT JOIN tbl_equipments e 
                            ON d.equipment_id = e.equipment_id 
                            AND e.port = o.org_id 
                        GROUP BY o.organisation_name, s.stage,s.stage_id
                        ORDER BY o.organisation_name ASC, s.stage_id ASC;
    `;

     let result = await request.query(query);
     return res.json({ records:result.recordset||[] });


   }catch(err){
       console.log(err);
       return res.status(500).json({ message: err.message || "Internal Server Error" });
   }
}

async function getAllOrganisationsHavingProcurements(req,res){
    try{
        const request=await pool.request();
        const query=`
                            WITH p AS (
                                SELECT DISTINCT port FROM tbl_equipments
                            )
                            SELECT m.organisation_name as org ,
                            m.org_id as id
                            FROM mmt_organisation m
                            JOIN p ON m.org_id = p.port;
        `;

        let result = await request.query(query);
        return res.json({organisations:result.recordset||[]});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Internal Server Error"});
    }
}


module.exports = {
    getActiveStages,
    getAllStages,
    getStageById,
    toggleStageStatus,
    createStage,
    updateStage,
    getStageDataForOrganisation,
    getAllOrganisationsHavingProcurements,
    getStageDataForOrganisationWithCategory
};