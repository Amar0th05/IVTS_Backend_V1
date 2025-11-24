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
            SELECT
                p.ID,
                p.ProjectID,
                p.ProjectName,
                p.ProjectIncharge,
                c.ID as ClientID,
                c.ClientName,
                p.EstStartDate,
                p.EstEndDate,
                p.ActualStartDate,
                p.ActualEndDate,
                p.ProjectCost,
                p.GST,
                p.NoOfDeliverables,
                p.ProjectStatus,
                p.TotalProjectCost
            FROM tbl_project_tracking p
                     LEFT JOIN mmt_clients c ON p.Client = c.ID
            ORDER BY
                CASE
                    WHEN p.ProjectStatus = 'Ongoing' THEN 1
                    WHEN p.ProjectStatus = 'Completed' THEN 2
                    WHEN p.ProjectStatus = 'Withdrawn' THEN 3
                    WHEN p.ProjectStatus IS NULL THEN 4
                    ELSE 5
                    END,
                p.ID;

        `;


        const result=await request.query(query);


        return res.status(200).json({projects:result.recordset||[]});



    }catch(err){
        console.error("Error while getting all projects", err);
        res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}
async function getProjectIncharge(req, res) {
  console.log("getstaff enter");
  try {
    // ✅ SQL Server query to fetch all staff
    const result = await pool.request().query(`
      SELECT
                [Employee_ID_if_already_assigned] AS id,
                [Staff_Name] AS name
            FROM
                [dbo].[Staffs]
            WHERE
                [Designation] IN (
                    'Project Officer',
                    'Principal Project Officer',
                    'Project Research Scientist'
                );
    `);

    res.json({staffid:result.recordset});
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ err: "Server error" });
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
                    c.ID as ClientID,
                    p.EstStartDate,
                    p.EstEndDate,
                    p.ActualStartDate,
                    p.ActualEndDate,
                    p.ProjectCost,
                    p.GST,
                    p.NoOfDeliverables,
                    p.NoOfPayments,
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
        project.Payments = (await pool.request()
            .input('projectID', sql.VarChar, project.ProjectID)
            .query(`
                SELECT *
                FROM tbl_project_payment_terms
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

        const data = JSON.parse(req.body.data);
        const deliverables = JSON.parse(req.body.deliverables);
        const payments = JSON.parse(req.body.payments);
        const files = req.files || [];

        if (!data) {
            return res.status(400).json({ message: "Nothing to insert" });
        }
        if (!deliverables || deliverables.length === 0) {
            return res.status(400).json({ message: "At least one deliverable is required" });
        }
        if (!payments || payments.length === 0) {
            return res.status(400).json({ message: "At least one payment is required" });
        }

        const requiredFields = ['ProjectID', 'ProjectName', 'ProjectIncharge', 'ClientName', 'EstStartDate', 'ActualEndDate', 'ProjectCost', 'GST', 'NoOfDeliverables', 'NoOfPayments', 'ProjectStatus'];
        const requiredMap = ['Project Id', 'Project Name', 'Project Incharge', 'Client', 'Start Date', 'End Date', 'Project Cost', 'GST', 'Number Of Deliverables', 'Number Of Payments', 'Project Status'];

        const errors = [];
        requiredFields.forEach((field, index) => {
            if (data[field] === null || data[field] === undefined || data[field] === '') {
                errors.push(`Field ${requiredMap[index]} is required`);
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ message: errors[0] });
        }

        if (data.EstEndDate && new Date(data.EstEndDate) < new Date(data.StartDate)) {
            return res.status(400).json({ message: "Project end date must be after project start date" });
        }
        if (data.ActualEndDate && new Date(data.ActualEndDate) < new Date(data.StartDate)) {
            return res.status(400).json({ message: "Actual End Date must be after Start Date." });
        }

        if (Number(data.ProjectCost) < 0 || Number(data.GST) < 0) {
            return res.status(400).json({ message: "Project Cost and GST cannot be negative." });
        }

        for (let i = 0; i < deliverables.length; i++) {
            const deliverable = deliverables[i];
            if (!deliverable.name || !deliverable.estimatedDeliveryDate || deliverable.totalCost == null) {
                return res.status(400).json({ message: `Invalid data at deliverable ${i + 1}` });
            }
            if (isNaN(deliverable.totalCost) || Number(deliverable.totalCost) < 0) {
                return res.status(400).json({ message: "Deliverable cost must be a positive number" });
            }
        }
        for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];
            if (!payment.description || payment.PaymentStatus == null) {
                return res.status(400).json({ message: `Invalid data at payment ${i + 1}` });
            }
            if (payment.PaymentAmount != null && (isNaN(payment.PaymentAmount) || Number(payment.PaymentAmount) < 0)) {
                return res.status(400).json({ message: "Payment amount must be a positive number" });
            }
        }

        await transaction.begin();

        const projectRequest = new sql.Request(transaction);
        const projectQuery = `
            INSERT INTO tbl_project_tracking (
                ProjectID, ProjectName, ProjectIncharge, Client,EstStartDate, EstEndDate,ActualStartDate,ActualEndDate, NoOfDeliverables, NoOfPayments, ProjectCost, GST, ProjectStatus
            )
            OUTPUT INSERTED.ID
            VALUES (
                @ProjectID, @ProjectName, @ProjectIncharge, @Client, @EstStartDate, @EstEndDate, @ActualStartDate,
                @ActualEndDate, @NoOfDeliverables, @NoOfPayments, @ProjectCost, @GST, @ProjectStatus
            );
        `;

        projectRequest
            .input('ProjectID',  data.ProjectID)
            .input('ProjectName',data.ProjectName)
            .input('Client', data.ClientName)
            .input('ProjectIncharge',  data.ProjectIncharge)
            .input('EstStartDate', data.EstStartDate)
            .input('EstEndDate', data.EstEndDate || null)
            .input('ActualStartDate', data.ActualStartDate || null)
            .input('ActualEndDate',data.ActualEndDate || null)
            .input('ProjectCost', data.ProjectCost)
            .input('GST', data.GST)
            .input('NoOfDeliverables', data.NoOfDeliverables)
            .input('NoOfPayments', data.NoOfPayments)
            .input('ProjectStatus', data.ProjectStatus);

        const projectResult = await projectRequest.query(projectQuery);
        if (projectResult.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Project creation failed" });
        }

        const projectId = projectResult.recordset[0].ID;

        for (const deliverable of deliverables) {
            const deliverableRequest = new sql.Request(transaction);
            await deliverableRequest
                .input("ProjectID",  data.ProjectID)
                .input("DeliverableName", deliverable.name)
                .input("EstDeliveryDate", deliverable.estimatedDeliveryDate)
                .input("Remarks",  deliverable.remarks || null)
                .input("TotalCost",  deliverable.totalCost)
                .query(`
                    INSERT INTO tbl_project_deliverables 
                    (ProjectID, EstDeliveryDate, Remarks, TotalCost, DeliverableName)
                    VALUES (@ProjectID, @EstDeliveryDate, @Remarks, @TotalCost, @DeliverableName);
                `);
        }

        for (const payment of payments) {
            const paymentRequest = new sql.Request(transaction);
            await paymentRequest
                .input("ProjectID",  data.ProjectID)
                .input("Description", payment.description)
                .input("PaymentAmount",  payment.PaymentAmount || null)
                .input("PaymentStatus",  payment.PaymentStatus)
                .query(`
                    INSERT INTO tbl_project_payment_terms 
                    (ProjectID, Description, PaymentAmount, PaymentStatus)
                    VALUES (@ProjectID, @Description, @PaymentAmount, @PaymentStatus);
                `);
        }
        await transaction.commit();
        return res.status(201).json({
            id: projectId,
            message: "Project created successfully with deliverables and payments"
        });

    } catch (err) {
        console.error("Error in createProject:", err);

        try {
            if (transaction._aborted === false) {
                await transaction.rollback();
            }
        } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
        }

        if (err.number === 2627) {
            return res.status(400).json({ message: "Project with this ID already exists" });
        }

        return res.status(500).json({
            message: err.message || "Internal Server Error",
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
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

        if(data.EstStartDate!==undefined){
            request.input('EstStartDate',data.EstStartDate);
            updates.push('EstStartDate=@EstStartDate');
        }

        if(data.EstEndDate!==undefined && data.EstEndDate!==null && data.EstEndDate!==''){
            request.input('EstEndDate',data.EstEndDate);
            updates.push("EstEndDate=@EstEndDate");
        }
        if(data.ActualStartDate!==undefined){
            request.input('ActualStartDate',data.ActualStartDate);
            updates.push("ActualStartDate=@ActualStartDate");
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
         if(data.NoOfPayments!==undefined){
                if(isNaN(Number(data.NoOfPayments))||Number(data.NoOfPayments)<1){
                    return res.status(400).json({message:"Atleast one payment is required"});
                }else{
                    request.input('NoOfPayments',data.NoOfPayments);
                    updates.push('NoOfPayments=@NoOfPayments');
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

async function getStatusCounts(req,res){
    try{

        let request=await pool.request();
        let result=await request.query('select ProjectStatus,Count(*) as Count from tbl_project_tracking GROUP BY (ProjectStatus);');
        return res.status(200).json(result.recordset);

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message || "Internal Server Error"});
    }
}

async function getProjectPaidStatus(req,res){
    try{
        let request=await pool.request();
        let query=`
           SELECT 
    pt.PaymentAmount,
    pt.PaymentStatus,
    p.ProjectStatus
FROM tbl_project_payment_terms pt
LEFT JOIN tbl_project_tracking p 
    ON p.ProjectID = pt.ProjectID
WHERE 
    p.ProjectStatus IN ('Ongoing', 'Completed')
    AND pt.PaymentStatus = 'Received';

        `;
        let result = await request.query(query);
        return res.status(200).json(result.recordset);


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
    getStatusCounts,
    getProjectPaidStatus,
    getProjectIncharge
}