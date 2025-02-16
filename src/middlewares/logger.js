const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'server.log');

const logger = (req, res, next) => {
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}\n`;


    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Error writing log:', err);
        }
    });

    console.log(logEntry.trim());
    next();
};

module.exports = {logger};
