const { sql, getPool } = require("../config/dbconfig");

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (error) {
        console.error("Equipment List Controller : ", error);
    }
})();

async function getAllEquipments(req, res) {
    try {
        const request = pool.request();
        const result = await request.query("SELECT * FROM tbl_equipments");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getEquipmentById(req, res) {
    try {
        const request = pool.request();
        const result = await request
            .input("equipment_id", sql.Int, req.params.id)
            .query("SELECT * FROM tbl_equipments WHERE equipment_id = @equipment_id");
        res.json(result.recordset[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createEquipment(req, res) {
    try {
        const { port, equipment, equipment_category, total_quantity } = req.body;

        if (!equipment) {
            return res.status(400).json({ error: "Equipment name is required" });
        }

        const request = pool.request();
        await request
            .input("port", sql.Int, port || null)
            .input("equipment", sql.NVarChar, equipment)
            .input("equipment_category", sql.Int, equipment_category || null)
            .input("total_quantity", sql.Int, total_quantity || null)
            .query(`INSERT INTO tbl_equipments (port, equipment, equipment_category, total_quantity)
                    VALUES (@port, @equipment, @equipment_category, @total_quantity)`);
        res.json({ message: "Equipment added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateEquipment(req, res) {
    try {
        const { port, equipment, equipment_category, total_quantity } = req.body;

        if (!equipment) {
            return res.status(400).json({ error: "Equipment name is required" });
        }

        const request = pool.request();
        await request
            .input("equipment_id", sql.Int, req.params.id)
            .input("port", sql.Int, port || null)
            .input("equipment", sql.NVarChar, equipment)
            .input("equipment_category", sql.Int, equipment_category || null)
            .input("total_quantity", sql.Int, total_quantity || null)
            .query(`UPDATE tbl_equipments SET
                                              port = @port,
                                              equipment = @equipment,
                                              equipment_category = @equipment_category,
                                              total_quantity = @total_quantity
                    WHERE equipment_id = @equipment_id`);
        res.json({ message: "Equipment updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deleteEquipment(req, res) {
    try {
        const request = pool.request();
        await request
            .input("equipment_id", sql.Int, req.params.id)
            .query("DELETE FROM tbl_equipments WHERE equipment_id = @equipment_id");
        res.json({ message: "Equipment deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentById,
    getAllEquipments
};
