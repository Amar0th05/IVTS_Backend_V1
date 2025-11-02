const {getAllAssets,getAssets,getStaff,addLaptops,toggleLaptopStatus,updateServer,getAllLaptops,getAllDesktop,getAllServer,updateLaptops,addDesktop,addServer,toggleDesktopStatus,toggleServerStatus,updateDesktops,getAllPrinter,addPrinter,togglePrinterStatus,updatePrinter,downloadBarCode,
    addVerification,updateAssetVerification,completeVerification,getAllVerifications,
    getAssetVerificationByAssetId
}=require('../controllers/assetsController');
const express=require('express');
const assetsRouter=express.Router();

// assets
assetsRouter.get('/',getAllAssets);

// laptop
assetsRouter.get('/Laptops',getAllLaptops);
assetsRouter.post('/Laptops/add',addLaptops);
assetsRouter.put('/Laptops/status/:id',toggleLaptopStatus);
assetsRouter.put('/Laptops/update',updateLaptops);


// desktop
assetsRouter.get('/Desktops',getAllDesktop);
assetsRouter.post('/Desktops/add',addDesktop);
assetsRouter.put('/Desktops/status/:id',toggleDesktopStatus);
assetsRouter.put('/Desktops/update',updateDesktops);

// server
assetsRouter.get('/Servers',getAllServer);
assetsRouter.post('/Servers/add',addServer);
assetsRouter.put('/Servers/status/:id',toggleServerStatus);
assetsRouter.put('/Servers/update',updateServer);


// printer
assetsRouter.get('/Printer',getAllPrinter);
assetsRouter.post('/Printer/add',addPrinter);
assetsRouter.put('/Printer/status/:id',togglePrinterStatus);
assetsRouter.put('/Printer/update',updatePrinter);


assetsRouter.get('/getstaff',getStaff);
assetsRouter.get('/:id',getAssets);

// download bar code

assetsRouter.get('/barcode/:assetId',downloadBarCode);
assetsRouter.get('/details/:id',getAssets);

// Assets Verification

assetsRouter.post('/verification/start',addVerification);

// 2. Update Individual Asset Verification

assetsRouter.post('/verification/update',updateAssetVerification);

// 3. Complete Verification Cycle

assetsRouter.post('/verification/complete',completeVerification);

// 4. Fetch Current Verification Details

assetsRouter.get('/verification/current', getAllVerifications);

// 5. AssetVerification by AssetId

assetsRouter.get('/verification/:assetId',getAssetVerificationByAssetId);


module.exports={assetsRouter};