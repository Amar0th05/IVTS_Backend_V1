
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

const connectToDB = async () => {
    try {
        await sql.connect(config);
        console.log("Connected to SQL Server...");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
};

module.exports = { sql, connectToDB };
