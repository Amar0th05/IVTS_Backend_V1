const { sql, getPool } = require('../config/dbconfig');

let pool;
(async () => {
    try {
        pool = await getPool();
    } catch (error) {
        console.error('Equipment Delivery Controller:', error);
    }
})();


async function getAllEquipmentDeliveries(req, res) {
    try {
        const request = await pool.request();
        const query = `SELECT * FROM tbl_equipment_delivery`;
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: "No records found." });
        }
        return res.json({ deliveries: result.recordset });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
}


async function getEquipmentDeliveryById(req, res) {
    try {
        const { id } = req.params;
        const request = await pool.request();
        const query = `SELECT * FROM tbl_equipment_delivery WHERE delivery_id = @id`;
        request.input('id', sql.Int, id);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: "Record not found." });
        }
        return res.json({ delivery: result.recordset[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
}


async function createEquipmentDelivery(req, res) {
    try {
        const { equipment_id, quantity_delivered, quantity_pending_for_delivery, reason_for_pending_delivery, supplied_at_port, installed_at_port, stage_id } = req.body;
        const request = await pool.request();
        const query = `INSERT INTO tbl_equipment_delivery (equipment_id, quantity_delivered, quantity_pending_for_delivery, reason_for_pending_delivery, supplied_at_port, installed_at_port, stage_id)
                        VALUES (@equipment_id, @quantity_delivered, @quantity_pending_for_delivery, @reason_for_pending_delivery, @supplied_at_port, @installed_at_port, @stage_id)`;

        if (equipment_id !== undefined) request.input('equipment_id', sql.Int, equipment_id);
        if (quantity_delivered !== undefined) request.input('quantity_delivered', sql.Int, quantity_delivered);
        if (quantity_pending_for_delivery !== undefined) request.input('quantity_pending_for_delivery', sql.Int, quantity_pending_for_delivery);
        if (reason_for_pending_delivery !== undefined) request.input('reason_for_pending_delivery', sql.NVarChar, reason_for_pending_delivery);
        if (supplied_at_port !== undefined) request.input('supplied_at_port', sql.Date, supplied_at_port);
        if (installed_at_port !== undefined) request.input('installed_at_port', sql.Date, installed_at_port);
        if (stage_id !== undefined) request.input('stage_id', sql.Int, stage_id);

        await request.query(query);
        return res.status(201).send({ message: "Equipment delivery created successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
}


async function updateEquipmentDelivery(req, res) {
    try {
        const { id } = req.params;
        const fields = req.body;



        if (Object.keys(fields).length === 0) {
            return res.status(400).send({ message: "No fields to update." });
        }

        const request = await pool.request();


        const getEquipmentQuery = `
            SELECT ed.equipment_id, e.total_quantity, ed.quantity_pending_for_delivery 
            FROM tbl_equipment_delivery ed
            JOIN tbl_equipments e ON ed.equipment_id = e.equipment_id
            WHERE ed.delivery_id = @id
        `;
        request.input('id', sql.Int, id);
        const result = await request.query(getEquipmentQuery);

        console.log(result.recordset[0]);

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: "Delivery record not found." });
        }

        const { equipment_id, total_quantity, quantity_pending_for_delivery } = result.recordset[0];

        let updateQuery = 'UPDATE tbl_equipment_delivery SET ';
        const updateRequest = await pool.request();

        Object.keys(fields).forEach((key, index) => {
            updateQuery += `${key} = @${key}`;
            if (index < Object.keys(fields).length - 1) updateQuery += ', ';
            updateRequest.input(key, fields[key]);
        });


        if (fields.quantity_delivered !== undefined) {
            if(total_quantity<fields.quantity_delivered){
                return res.status(400).send({ message: "greater than total quantity" });
            }
            const newPendingQuantity = Math.max(total_quantity - fields.quantity_delivered, 0);
            updateQuery += `, quantity_pending_for_delivery = @newPendingQuantity`;
            updateRequest.input('newPendingQuantity', sql.Int, newPendingQuantity);
        }

        updateQuery += ' WHERE delivery_id = @id';
        updateRequest.input('id', sql.Int, id);

        await updateRequest.query(updateQuery);
        return res.send({ message: "Equipment delivery updated successfully." });

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
}




async function deleteEquipmentDelivery(req, res) {
    try {
        const { id } = req.params;
        const request = await pool.request();
        const query = `DELETE FROM tbl_equipment_delivery WHERE delivery_id = @id`;
        request.input('id', sql.Int, id);

        await request.query(query);
        return res.send({ message: "Equipment delivery deleted successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: err.message });
    }
}


// async function getEquipmentDeliveryStageSummary(req,res){
//     try{
//         const request=await pool.request();
//         let query=`
//
//
//         `;
//     }catch(err){ 
//         console.log(err);
//         return res.status(500).send({ message: err.message });   
//     }
// }


async function getAllEquipmentsForPort(req,res){
    try{
        const id=req.params.id;
        const request=await pool.request();
        request.input('id', id);
        const query=`
                                select e.equipment,
                                e.total_quantity as totalQuantity,
                                d.stage_id as stage,
                                e.equipment_category as category
                                from tbl_equipments e
                                inner join tbl_equipment_delivery d on d.equipment_id=e.equipment_id and e.port=@id;
        `;
        const result = await request.query(query);
        const data=result.recordset;
        if(!data){
            return res.json({equipments:[]});
        }

        let equipments = {};

        data.forEach((e) => {

            if (!equipments[e.category]) {
                equipments[e.category] = {};
            }


            if (!equipments[e.category][e.stage]) {
                equipments[e.category][e.stage] = [];
            }


            equipments[e.category][e.stage].push({
                equipment: e.equipment,
                totalQuantity: e.totalQuantity,
            });
        });
        return res.json({equipments:equipments||[]});

    }catch(err){
        console.error(err);
        return res.status(500).send({ message: err.message||'Internal Server Error' });
    }
}

module.exports = {
    getAllEquipmentDeliveries,
    getEquipmentDeliveryById,
    createEquipmentDelivery,
    updateEquipmentDelivery,
    deleteEquipmentDelivery,
    getAllEquipmentsForPort,
};
