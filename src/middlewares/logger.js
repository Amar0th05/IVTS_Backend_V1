const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const logFilePath = path.join("logs", 'server.log');

const logger = (req, res, next) => {

    if (req.path.startsWith("/auth") && req.method === 'POST') {
        const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} from User: Unauthenticated\n`;
        fs.appendFile(logFilePath, logEntry, (err) => {
            if (err) {
                console.error('Error writing log:', err);
            }
        });
        console.log(logEntry.trim());
        return next();
    }


    let user = "Unknown User";
    let userId = "Unknown ID";

    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = decoded.user.name;
            userId = decoded.user.id;
        }
    } catch (error) {
        console.error("Invalid Token:", error.message);
    }

    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} from User: ${user} [${userId}]\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Error writing log:', err);
        }
    });

    console.log(logEntry.trim());
    next();
};

module.exports = { logger };