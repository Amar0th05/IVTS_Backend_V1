const {sql,getPool} = require('../config/dbconfig');
const res = require("express/lib/response");


let pool;
(async ()=>{
    pool=await getPool();
})();

async function getAllRoles(req,res){
    try{
        const request=await pool.request();
        const query = `SELECT role_id AS roleID,role FROM mmt_user_roles ORDER BY role_id;`;

        const result=await request.query(query);

        if(result.recordset.length>0){
            return res.status(200).json({roles:result.recordset});

        }

        return res.status(404).json({error:"No roles found"});
    }catch(err){
        console.error('Error while getting roles',err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function createRole(req, res) {
    let transaction;
    try {
        const { name, permissions } = req.body;

        // 1. Validate input
        if (!name || !permissions) {
            return res.status(400).json({ message: "Role name and permissions are required" });
        }

        // 2. Initialize transaction
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 3. Check if role exists
        const roleCheck = await new sql.Request(transaction)
            .input('name', sql.NVarChar(50), name)
            .query('SELECT role_id FROM mmt_user_roles WHERE role = @name');

        if (roleCheck.recordset.length > 0) {
            await transaction.rollback();
            return res.status(409).json({ message: "Role already exists" });
        }

        // 4. Create role
        const roleResult = await new sql.Request(transaction)
            .input('name', sql.NVarChar(50), name)
            .query('INSERT INTO mmt_user_roles (role) OUTPUT INSERTED.role_id VALUES (@name)');

        const roleId = roleResult.recordset[0].role_id;

        // 5. Insert permissions
        for (const perm of permissions) {
            await new sql.Request(transaction)
                .input('roleId', sql.Int, roleId)
                .input('moduleId', sql.Int, perm.moduleId)
                .input('canRead', sql.Bit, perm.canRead)
                .input('canWrite', sql.Bit, perm.canWrite)
                .query(`
                    INSERT INTO tbl_role_module_perms 
                    (RoleID, ModuleID, CanRead, CanWrite) 
                    VALUES (@roleId, @moduleId, @canRead, @canWrite)
                `);
        }

        // 6. Commit if successful
        await transaction.commit();

        return res.status(201).json({
            id: roleId,
            name: name,
            permissions: permissions
        });

    } catch (err) {
        // 7. Proper transaction cleanup
        if (transaction && transaction._active) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error("Rollback failed:", rollbackErr);
            }
        }

        console.error("Error in createRole:", err);

        // 8. Specific error handling
        if (err instanceof sql.TransactionError && err.code === 'ENOTBEGUN') {
            return res.status(500).json({
                message: "Transaction initialization failed",
                details: err.message
            });
        }

        return res.status(500).json({
            message: "Internal Server Error",
            details: err.message || null
        });
    }
}
async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const request = pool.request();

        request.input('id',sql.Int,id);
        request.input('name',sql.NVarChar,name);

        if(!name || name.trim() === ""){
            return res.status(400).json({ message: "Role is required" });
        }
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "Role id is invalid" });
        }

        const result = await request.query(`UPDATE mmt_user_roles SET role=@name WHERE role_id=@id`);
        if (result.rowsAffected > 0) {
            return res.json({ message: "Role updated successfully" });
        }
        return res.status(404).json({ message: "Role not found" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}

async function getRoleById(req, res) {
    try{
        const request = pool.request();
        const id = req.params.id;
        if(isNaN(id)||id===undefined){
            return res.status(400).json({ message: "id is required" });
        }

        request.input('id',sql.Int,id);

        const query=`SELECT * FROM mmt_user_roles WHERE role_id=@id`;
        const result = await request.query(query);

        if(result.recordset.length===0){
            return res.status(404).json({message:"Role not found"});
        }
        return res.status(200).json({
            role:{
                roleID:result.recordset[0].role_id,
                role:result.recordset[0].role
            }
        });

    }catch(err){
        console.error("Error in getRoleById:", err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function getRolePermissionsForModules(req, res) {
    try{


        let request = await pool.request();
        let query=`

            SELECT
                mur.role_id AS RoleID,
                mur.role AS RoleName,
                STRING_AGG(
                        CASE WHEN rmp.CanWrite = 1 THEN mm.Name END,
                        ','
                ) AS Writes,
                STRING_AGG(
                        CASE WHEN rmp.CanRead = 1 THEN mm.Name END,
                        ','
                ) AS Reads
            FROM
                mmt_user_roles mur
                    LEFT JOIN
                tbl_role_module_perms rmp ON mur.role_id = rmp.RoleID
                    LEFT JOIN
                mmt_modules mm ON rmp.ModuleID = mm.ID
            GROUP BY
                mur.role_id, mur.role
            ORDER BY
                mur.role;
       `;

        let result=await request.query(query);
        let roles={};
        if(result.recordset.length>0){
            let records=result.recordset;
            records=records.map(record=>{
                // console.log(record);
               let writes=record.Writes;
               writes=writes?writes.split(','):null;
               let reads=record.Reads;
               reads=reads?reads.split(','):null;

               record.Writes=writes;
               record.Reads=reads;

               return record;
            });

            records.forEach(record=>{
               let role={
                   id:record.RoleID,
                   name:record.RoleName,
                   writes:record.Writes,
                   reads:record.Reads,
               }
               console.log("role:", role);

               roles[record.RoleName.toUpperCase()]=role;
               console.log("roles:", roles);
            });

            // console.log(roles);

            return res.status(200).json({roles:roles});
        }
        return res.status(404).json({error:"role not found"});


    }catch(err){
        console.error("Error in getRolePermissionsForModules:", err);
        res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}
async function getRolePermissionsForModulesById(req, res) {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: "ID is required" });
        }

        const request = await pool.request();
        request.input('id', id);

        const query = `
            SELECT
                mur.role_id AS RoleID,
                mur.role AS RoleName,
                STRING_AGG(CASE WHEN rmp.CanWrite = 1 THEN mm.Name END, ',') AS Writes,
                STRING_AGG(CASE WHEN rmp.CanRead = 1 THEN mm.Name END, ',') AS Reads
            FROM mmt_user_roles mur
                     LEFT JOIN tbl_role_module_perms rmp ON mur.role_id = rmp.RoleID
                     LEFT JOIN mmt_modules mm ON rmp.ModuleID = mm.ID
            WHERE mur.role_id = @id
            GROUP BY mur.role_id, mur.role
            ORDER BY mur.role;
        `;


        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Role not found" });
        }

        const roles = {};

        for (const record of result.recordset) {
            const writes = record.Writes ? record.Writes.split(',').filter(Boolean) : [];
            const reads = record.Reads ? record.Reads.split(',').filter(Boolean) : [];

            roles[record.RoleName.toUpperCase()] = {
                id: record.RoleID,
                name: record.RoleName,
                writes,
                reads
            };
        }

        return res.status(200).json({ roles });

    } catch (err) {
        console.error("Error in getRolePermissionsForModulesById:", err);
        res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}



async function updatePermission(req, res) {
    try {
        let request = await pool.request();
        let roleId = req.params.id;
        let data = req.body;


        if (!roleId) {
            return res.status(400).json({ message: "Missing required field role id" });
        }

        if (!data) {
            return res.status(400).json({ message: "No body found" });
        }

        if (data.ModuleID === undefined || data.ModuleID === null) {
            return res.status(400).json({ message: "Missing required field module id" });
        }

        if (data.permission === undefined || data.permission === null) {
            return res.status(400).json({ message: "Missing required field permission" });
        }

        if (data.value === undefined || data.value === null) {
            return res.status(400).json({ message: "Missing required field value" });
        }

        if (data.permission !== 'CanRead' && data.permission !== 'CanWrite') {
            return res.status(400).json({ message: "Undefined permission " + data.permission });
        }


        request.input('RoleID', roleId);
        request.input('Value', data.value);
        request.input('ModuleID', data.ModuleID);
        request.input('Permission', data.permission);


        let checkQuery = `
            SELECT COUNT(*) as count
            FROM tbl_role_module_perms
            WHERE RoleID = @RoleID  AND CanRead = 1;
        `;

        let checkResult = await request.query(checkQuery);

        console.log(checkResult.recordset[0]);
        if (checkResult.recordset[0].count === 1 && data.permission === 'CanRead' && data.value === 0) {
            return res.status(400).json({ message: "At least one read permission is required for a role" });
        }


        const query = `
            UPDATE tbl_role_module_perms
            SET ${data.permission} = @Value
            WHERE RoleID = @RoleID AND ModuleID = @ModuleID;
        `;

        let result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(500).json({ message: "Something went wrong, please try again" });
        }

        return res.status(200).json({ message: "Permission updated successfully" });

    } catch (err) {
        console.log('Error in Roles Controller:', err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}



module.exports={
    getAllRoles,
    updateRole,
    createRole,
    getRoleById,
    getRolePermissionsForModules,
    getRolePermissionsForModulesById,
    updatePermission
}