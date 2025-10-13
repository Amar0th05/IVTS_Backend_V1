const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const logDir = "logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir); // ensure folder exists
const logFilePath = path.join(logDir, "server.log");

const logger = (req, res, next) => {
  // Skip preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return next();
  }

  // Handle auth routes (unauthenticated)
  if (req.path.startsWith("/auth") && req.method === "POST") {
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} from User: Unauthenticated\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(logEntry.trim());
    return next();
  }

  // Extract user info from JWT
  let user = "Unknown User";
  let userId = "Unknown ID";
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = decoded.user?.name || "Unknown User";
      userId = decoded.user?.id || "Unknown ID";
    }
  } catch (error) {
    console.error("Invalid Token:", error.message);
  }

  // Format log entry
  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} from User: ${user} [${userId}]\n`;

  // Write to file and console
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (err) {
    console.error("Error writing log:", err);
  }

  console.log(logEntry.trim());
  next();
};

module.exports = { logger };
