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
        const { port, equipment, equipment_category, total_quantity, assets, spares} = req.body;

        if (!equipment) {
            return res.status(400).json({ error: "Equipment name is required" });
        }
        console.log(req.body);
        const request = pool.request();


        const equipmentResult = await request
            .input("port", sql.Int, port || null)
            .input("equipment", sql.NVarChar, equipment)
            .input("equipment_category", sql.Int, equipment_category || null)
            .input("total_quantity", sql.Int, total_quantity || null)
            .query(`INSERT INTO tbl_equipments (port, equipment, equipment_category, total_quantity)
                    OUTPUT INSERTED.equipment_id VALUES (@port, @equipment, @equipment_category, @total_quantity)`);

        const equipmentId = equipmentResult.recordset[0].equipment_id;


        const procurementResult = await request
            .input("equipment_id", sql.Int, equipmentId)
            .query(`INSERT INTO tbl_procurement_status (equipment_id)
                    OUTPUT INSERTED.procurement_id VALUES (@equipment_id)`);

        const procurementId = procurementResult.recordset[0].procurement_id;
        const deliveryResult=await request
            .query(`INSERT INTO tbl_equipment_delivery(equipment_id) VALUES (@equipment_id)`);

        if (assets && assets.length > 0) {
            const values = assets.map((asset, index) => `(@procurement_id, @serial_number${index}, 'Asset')`).join(", ");

            const request = pool.request();
            request.input("procurement_id", sql.Int, procurementId);

            assets.forEach((asset, index) => {
                request.input(`serial_number${index}`, sql.NVarChar, asset);
            });

            await request.query(`INSERT INTO tbl_assets_spares (procurement_id, serial_number, type) VALUES ${values}`);
        }



        if (spares && spares.length > 0) {
            const values = spares.map((spare, index) => `(@procurement_id, @serial_number${index}, 'Spare')`).join(", ");

            const request = pool.request();
            request.input("procurement_id", sql.Int, procurementId);

            spares.forEach((spare, index) => {
                request.input(`serial_number${index}`, sql.NVarChar, spare);
            });

            await request.query(`INSERT INTO tbl_assets_spares (procurement_id, serial_number, type) VALUES ${values}`);
        }



        res.json({ message: "Equipment, procurement, assets, and spares added successfully" });

    } catch (err) {
        console.log(err);
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
