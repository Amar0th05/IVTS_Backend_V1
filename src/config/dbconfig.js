
const sql = require("mssql");
require("dotenv").config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433,
};

let poolPromise;

const connectToDB = async () => {
    try {
        const pool=await sql.connect(config);
        console.log("Connected to SQL Server...");
        poolPromise = Promise.resolve(pool);
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
};

const getPool=async()=>{
    if(!poolPromise){
        await connectToDB();
    }
    return poolPromise;
};

module.exports = { sql, connectToDB, getPool };
