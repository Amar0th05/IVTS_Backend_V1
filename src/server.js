const http = require("http");
const app = require("./app.js");
const {startScheduler}=require('./Utils/ContractExpiryMailer');
const {startInvoiceUploadScheduler}=require('./Utils/invoiceUploadMailer');
const PORT = process.env.PORT || 5500;

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    startScheduler();
    startInvoiceUploadScheduler();
});
