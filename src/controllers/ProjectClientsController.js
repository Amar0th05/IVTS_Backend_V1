const {sql,getPool}=require('../config/dbconfig');

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

module.exports= {getAllActiveClients};