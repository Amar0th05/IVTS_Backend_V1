const {sql,getPool}=require('../config/dbconfig');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error while getting pool in Project Tracking controller", err);
    }
})();


async function getAllProjects(req,res){
    try{
        const request=await pool.request();

        let query=`
                    select
                        p.ID,
                        p.ProjectID,
                        p.ProjectName,
                        p.ProjectIncharge,
                        c.ClientName,
                        p.StartDate,
                        p.EstEndDate,
                        p.ActualEndDate,
                        p.ProjectCost,
                        p.GST,
                        p.NoOfDeliverables,
                        p.ProjectStatus,
                        p.TotalProjectCost
                    from tbl_project_tracking p
                    left join mmt_clients c on p.Client=c.ID
                    order by p.ID;
        `;


        const result=await request.query(query);


        return res.status(200).json({projects:result.recordset||[]});



    }catch(err){
        console.error("Error while getting all projects", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function getProjectById(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ message: "ID required" });

        const project = (await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    p.ID,
                    p.ProjectID,
                    p.ProjectName,
                    p.ProjectIncharge,
                    c.ClientName,
                    p.StartDate,
                    p.EstEndDate,
                    p.ActualEndDate,
                    p.ProjectCost,
                    p.GST,
                    p.NoOfDeliverables,
                    p.ProjectStatus,
                    p.TotalProjectCost
                FROM tbl_project_tracking p
                LEFT JOIN mmt_clients c ON p.Client = c.ID
                WHERE p.ID = @id
            `)).recordset[0];

        if (!project) return res.status(404).json({ message: "Project not found" });


        project.deliverables = (await pool.request()
            .input('projectID', sql.VarChar, project.ProjectID)
            .query(`
                SELECT *
                FROM tbl_project_deliverables
                WHERE ProjectID = @projectID
            `)).recordset;

        return res.status(200).json({ project });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}


async function createProject(req, res) {

    const transaction = new sql.Transaction(pool);

    try {
        const data = req.body;
        console.log(data);

        if (!data) {
            return res.status(400).json({ message: "Nothing to insert" });
        }

        let requiredFields = ['ProjectID', 'ProjectName', 'ProjectIncharge', 'Client', 'StartDate', 'ActualEndDate', 'ProjectCost', 'GST', 'NoOfDeliverables', 'ProjectStatus'];
        let requiredMap = ['Project Id', 'Project Name', 'Project Incharge', 'Client', 'Start Date', 'End Date', 'Project Cost', 'GST', 'Number Of Deliverables', 'Project Status'];

        let errors = [];
        requiredFields.forEach((field, index) => {
            if(data[field]===null || data[field]===undefined || data[field]===''){
                errors.push(`Field ${requiredMap[index]} is required`);
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0] });
        }

        if (!data.deliverables || data.deliverables.length === 0) {
            return res.status(400).json({ message: "At least one deliverable is required" });
        }

        for (let i = 0; i < data.deliverables.length; i++) {
            let deliverable = data.deliverables[i];

            if (!deliverable.name || !deliverable.estimatedDeliveryDate || deliverable.totalCost == null) {
                return res.status(400).json({ message: `Invalid data at deliverable ${i + 1}` });
            }

            if (isNaN(deliverable.totalCost) || Number(deliverable.totalCost) < 0) {
                return res.status(400).json({ message: "Deliverable cost must be a positive number" });
            }
        }

        if (data.EstEndDate && data.EstEndDate < data.StartDate) {
            return res.status(400).json({ message: "Project end date must be after project start date" });
        }

        if (data.ActualEndDate && data.StartDate && data.ActualEndDate < data.StartDate) {
            return res.status(400).json({ message: "Actual End Date must be after Start Date." });
        }

        if (data.ProjectCost < 0 || data.GST < 0) {
            return res.status(400).json({ message: "Project Cost and GST cannot be negative." });
        }

        data.EstEndDate = data.EstEndDate || null;


        await transaction.begin();


        const projectRequest = new sql.Request(transaction);
        projectRequest
            .input('ProjectID', data.ProjectID)
            .input('ProjectName', data.ProjectName)
            .input('Client', data.Client)
            .input('ProjectIncharge', data.ProjectIncharge)
            .input('StartDate', data.StartDate)
            .input('EstEndDate', data.EstEndDate)
            .input('ActualEndDate', data.ActualEndDate)
            .input('ProjectCost', data.ProjectCost)
            .input('GST', data.GST)
            .input('NoOfDeliverables', data.NoOfDeliverables)
            .input('ProjectStatus', data.ProjectStatus);

        const query = `
            INSERT INTO tbl_project_tracking (
                ProjectID, ProjectName, ProjectIncharge, Client, StartDate, EstEndDate, ActualEndDate, NoOfDeliverables, ProjectCost, GST, ProjectStatus
            )
            OUTPUT INSERTED.ID
            VALUES (
                       @ProjectID, @ProjectName, @ProjectIncharge, @Client, @StartDate, @EstEndDate, @ActualEndDate, @NoOfDeliverables, @ProjectCost, @GST, @ProjectStatus
                   );
        `;

        const result = await projectRequest.query(query);

        if (result.rowsAffected.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Project cannot be created" });
        }

        const projectId = result.recordset[0].ID;


        for (let deliverable of data.deliverables) {
            const deliverableRequest = new sql.Request(transaction);
            deliverableRequest
                .input("ProjectID", data.ProjectID)
                .input("DeliverableName",deliverable.name)
                .input("EstDeliveryDate", deliverable.estimatedDeliveryDate)
                .input("Remarks", deliverable.remarks || null)
                .input("TotalCost", deliverable.totalCost);

            await deliverableRequest.query(`
                INSERT INTO tbl_project_deliverables (ProjectID, EstDeliveryDate, Remarks, TotalCost,DeliverableName)
                VALUES (@ProjectID, @EstDeliveryDate, @Remarks, @TotalCost,@DeliverableName);
            `);
        }

        await transaction.commit();
        return res.status(201).json({ id: projectId, message: "Project created successfully with deliverables" });

    } catch (err) {
        console.error(err);
        if(err.number===2627){
            return res.status(400).json({ message: "Project with this ID already exists" });
        }
        if (transaction._aborted === false) {
            await transaction.rollback().catch(console.error);
        }
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function updateProject(req,res){
    try{
        const request = await pool.request();
        const data=req.body;

        if(!data){
            return res.status(400).json({message:"no data to update"});
        }

        console.log(data);

        if(!data.ID){
            return res.status(400).json({message:"Project ID is missing"});
        }

        request.input("ID",data.ID);

        let updates=[];

        if(data.ProjectID!==undefined){
            request.input('ProjectID',data.ProjectID);
            updates.push("ProjectID=@ProjectID");
        }

        if(data.ProjectName!==undefined){
            request.input('ProjectName',data.ProjectName);
            updates.push("ProjectName=@ProjectName");
        }

        if(!isNaN(Number(data.Client)) && data.Client!==undefined && data.Client!==null){
            request.input('Client',data.Client);
            updates.push("Client=@Client");
        }

        if(data.ProjectIncharge!==undefined){
            request.input('ProjectIncharge',data.ProjectIncharge);
            updates.push("ProjectIncharge=@ProjectIncharge");
        }

        if(data.StartDate!==undefined){
            request.input('StartDate',data.StartDate);
            updates.push('StartDate=@StartDate');
        }

        if(data.EstEndDate!==undefined && data.EstEndDate!==null && data.EstEndDate!==''){
            request.input('EstEndDate',data.EstEndDate);
            updates.push("EstEndDate=@EstEndDate");
        }

        if(data.ActualEndDate!==undefined){
            request.input('ActualEndDate',data.ActualEndDate);
            updates.push("ActualEndDate=@ActualEndDate");
        }

        if(data.ProjectCost!==undefined){
            if(isNaN(Number(data.ProjectCost))||Number(data.ProjectCost)<0){
                return res.status(400).json({message:"Project Cost is invalid"});
            }else{
                request.input('ProjectCost',data.ProjectCost);
                updates.push("ProjectCost=@ProjectCost");
            }
        }

       if(data.GST!==undefined){
           if(isNaN(Number(data.GST)) || Number(data.GST)<0){
               return res.status(400).json({message:"Project GST is invalid"});
           }else{
               request.input('GST',data.GST);
               updates.push('GST=@GST');
           }
       }

       if(data.NoOfDeliverables!==undefined){
           if(isNaN(Number(data.NoOfDeliverables))||Number(data.NoOfDeliverables)<1){
               return res.status(400).json({message:"Atleast one deliverable is required"});
           }else{
               request.input('NoOfDeliverables',data.NoOfDeliverables);
               updates.push('NoOfDeliverables=@NoOfDeliverables');
           }
       }

       if(data.ProjectStatus!==undefined){
           request.input("ProjectStatus",data.ProjectStatus);
           updates.push("ProjectStatus=@ProjectStatus");
       }

       let query=`UPDATE tbl_project_tracking SET ${updates.join(',')} WHERE ID=@ID`;
       const result = await request.query(query);

       if(result.rowsAffected>0){
           return res.status(200).json({message:'Project updated successfully'});
       }

       return res.status(400).json({message:"Cannot update the project"});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message || "Internal Server Error"});
    }
}

module.exports = {

    getAllProjects,
    getProjectById,
    createProject,
    updateProject,

}