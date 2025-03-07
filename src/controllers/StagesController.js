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

module.exports = {
    getActiveStages,
    getAllStages,
    getStageById,
    toggleStageStatus,
    createStage,
    updateStage,
};