const {sql,getPool}=require('../config/dbconfig');
const err = require("multer/lib/multer-error");
const {query} = require("express");

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error("Error while getting pool in Project Clients controller", err);
    }
})();


async function getAllActiveClients(req, res) {
    try{

        const request=await pool.request();

        const query=`
                            select ID,ClientName from mmt_clients where Status=1;
        `;

        const result=await request.query(query);
        if(result.recordset.length>0){
            return res.status(200).send({clients:result.recordset});
        }

        return res.status(404).send({message:"No active clients found"});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal server error'});
    }
}

async function getAllClients(req,res){
    try{
        const request=await pool.request();
        const query=`
                            SELECT * FROM mmt_clients;
        `;

        const result=await request.query(query);

        return res.status(200).send({clients:result.recordset||[]});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal server error'});
    }
}

async function getClientById(req,res){
    try{
        const id=parseInt(req.params.id);

        if(!id){
            return res.status(404).send({message:"Invalid ID"});
        }

        const request=await pool.request();
        request.input('ID',id);

        const query=`
                            SELECT * FROM mmt_clients
                            WHERE ID=@ID;
        `
        const result=await request.query(query);
        if(result.recordset.length>0){
            return res.status(200).send({client:result.recordset[0]});
        }

        return res.status(404).send({message:`Client with ID ${req.params.id} not found`});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal server error'});
    }
}

async function toggleStatus(req,res){
    try{

        const request=await pool.request();

        const id = parseInt(req.params.id);

        if(!id){
            return res.status(400).json({message:'Invalid ID'});
        }

        request.input('id',id);

        const query=`
        
                            UPDATE mmt_clients 
            SET Status = CASE WHEN Status = 1 THEN 0 ELSE 1 END
            WHERE ID = @id;
        `;

        const result=await request.query(query);

        if(result.rowsAffected[0]>0){
            return res.status(200).send({message:'Status toggled successfully'});
        }

        return res.status(400).send({message:`Status toggle failed`});

    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal server error'});
    }
}

async function updateClient(req,res){
    try{

        const id=parseInt(req.params.id);
        const data=req.body;




        if(!id){
            return res.status(400).send({message:"Invalid ID"});
        }

        if(!data){
            return res.status(400).send({message:"Invalid ID"});
        }
        if(!data.ClientName){
            return res.status(400).send({message:"Invalid Client Name"});
        }



        const request=await pool.request();

        request.input('ID',id)
            .input('ClientName',data.ClientName);

       let query=`
                        UPDATE mmt_clients
                        set ClientName=@ClientName
                        WHERE ID=@ID;
       `;

        const result=await request.query(query);

        if(result.rowsAffected[0]>0){
            return res.status(200).send({message:"Client Name updated successfully"});
        }

        return res.status(400).send({message:`Client cannot be updated.`});



    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal server error'});
    }
}


async function createClient(req,res){
    try{

        const data=req.body;

        if(!data){
            return res.status(400).send({message:"Invalid data"});
        }

        if(!data.ClientName){
            return res.status(400).send({message:"Invalid Client Name"});
        }

        let request=await pool.request();
        request.input('ClientName',data.ClientName);
        let query=`
                            insert into mmt_clients(
                                                    ClientName, Status
                                                    
                            ) values(
                                     @ClientName,
                                     1
                                    );        
        `;
        const result=await request.query(query);
        if(result.rowsAffected[0]>0){
            return res.status(200).send({message:"Client created successfully"});
        }

        return res.status(400).json({message:'Can\'t create client'});


    }catch(err){
        console.log(err);
        return res.status(500).json({message:err.message||'Internal Server Error'});
    }
}

module.exports= {
    getAllActiveClients,
    getAllClients,
    getClientById,
    toggleStatus,
    updateClient,
    createClient,
};