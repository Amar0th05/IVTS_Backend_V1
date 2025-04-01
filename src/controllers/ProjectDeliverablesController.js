const {sql,getPool}=require("../config/dbconfig");
const {query} = require("express");

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.log(err);
    }
})();

async function updateDeliverable(req, res) {
    try {
        const request = await pool.request();
        const data  = req.body;
        console.log(data);

        if (!data) {
            return res.status(400).json({ message: "No inputs found to update" });
        }
        if (!data.ID) {
            return res.status(400).json({ message: "Deliverable ID is missing" });
        }

        let updates = [];

        request.input("ID", data.ID);

        if (data.DeliverableName !== undefined) {
            updates.push("DeliverableName=@DeliverableName");
            request.input("DeliverableName", data.DeliverableName);
        }

        if (data.EstDeliveryDate !== undefined) {
            updates.push("EstDeliveryDate=@EstDeliveryDate");
            request.input("EstDeliveryDate", data.EstDeliveryDate);
        }

        if (data.Remarks !== undefined) {
            updates.push("Remarks=@Remarks");
            request.input("Remarks", data.Remarks);
        }

        if (data.TotalCost !== undefined) {
            if (isNaN(Number(data.TotalCost))) {
                return res.status(400).json({ message: "Total cost must be a number" });
            }
            updates.push("TotalCost=@TotalCost");
            request.input("TotalCost", Number(data.TotalCost));
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No valid fields found to update" });
        }

        const query = `UPDATE tbl_project_deliverables SET ${updates.join(', ')} WHERE ID=@ID`;
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: "No matching records found to update" });
        }

        return res.json({ message: "Deliverable updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function createDeliverable(req, res) {
    try {
        const request = await pool.request();
        const data = req.body;

        if (!data) {
            return res.status(400).json({ message: "No inputs found to create" });
        }

        if (!data.ProjectID) {
            return res.status(400).json({ message: "Project ID is missing" });
        }

        if (!data.DeliverableName) {
            return res.status(400).json({ message: "Deliverable Name is missing" });
        }

        if (data.TotalCost === null || data.TotalCost === undefined) {
            return res.status(400).json({ message: "Total cost is required" });
        }

        if (!data.EstDeliveryDate) {
            return res.status(400).json({ message: "Estimated delivery date is required" });
        }

        data.Remarks = data.Remarks || null;

        console.log(data);

        request.input("DeliverableName", data.DeliverableName);
        request.input("EstDeliveryDate", data.EstDeliveryDate);
        request.input("Remarks", data.Remarks);
        request.input("TotalCost", data.TotalCost);
        request.input("ProjectID", data.ProjectID);

        const result = await request.query(`
            INSERT INTO tbl_project_deliverables (
                ProjectID, DeliverableName, EstDeliveryDate, TotalCost, Remarks
            ) VALUES (
                         @ProjectID, @DeliverableName, @EstDeliveryDate, @TotalCost, @Remarks
                     );

            UPDATE tbl_project_tracking
            SET NoOfDeliverables = NoOfDeliverables + 1
            WHERE ProjectID = @ProjectID;
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: "Unable to create Deliverables" });
        }

        return res.status(200).json({ message: 'Deliverable created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

module.exports={
    updateDeliverable,
    createDeliverable,
}