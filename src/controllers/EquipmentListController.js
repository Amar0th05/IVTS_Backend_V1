const{sql,getPool}=require('../config/dbconfig');


let pool;

(
    async()=>{
        try{
            pool = await getPool();
        }catch(error){
            console.error('Equipment List Controller : ',error);
        }
    }
)();

async function getEquipmentList(req, res) {
    try{
        const request=await pool.request();
        const query=`
        
                            SELECT 
                                eq.equipment_id AS equipmentID,
    eq.equipment,
    org.organisation_name AS port,
    cat.category_name AS equipmentCategory,
    eq.total_quantity AS totalQuantity,

    ps.procurement_id AS procurementId,
    ps.vendor_finalised AS vendorFinalised,
    ps.vendor_received_quotation AS vendorReceivedQuotation,
    ps.intend_raised AS intendRaised,
    ps.admin_approved AS adminApproved,
    ps.po_released AS poReleased,
    ps.equipment_delivered_at_ntcpwc AS equipmentDeliveredAtNtcpwc,
    ps.payment_settled_to_vendor_by_ntcpwc AS paymentSettledToVendorByNtcpwc,
    ps.invoice_submitted_by_ntcpwc AS invoiceSubmittedByNtcpwc,
    ps.amount_paid AS amountPaid,
    ps.gst,
    ps.total_amount_paid AS totalAmountPaid,
    ps.amount_received AS amountReceived,
    
    del.delivery_id AS deliveryID,
    del.quantity_delivered AS quantityDelivered,
    del.quantity_pending_for_delivery AS quantityPendingForDelivery,
    del.reason_for_pending_delivery AS reasonForPendingDelivery,
    del.supplied_at_port AS suppliedAtPort,
    del.installed_at_port AS installedAtPort,
    stg.stage AS stage

FROM tbl_equipments eq
LEFT JOIN mmt_equipment_category cat ON eq.equipment_category = cat.category_id
LEFT JOIN mmt_organisation org ON eq.port = org.org_id
LEFT JOIN tbl_procurement_status ps ON eq.equipment_id = ps.equipment_id
LEFT JOIN tbl_equipment_delivery del ON eq.equipment_id = del.equipment_id
LEFT JOIN mmt_stages stg ON del.stage_id = stg.stage_id;

        
        `;


        const result=await request.query(query);
        if(result.recordset.length<0){
            return res.status(404).send({message:"No record found."});
        }
        console.log('user : ',req.user);

        return res.json({equipmentList:result.recordset});
    }catch(err){
        console.log(err);
        return res.status(500).send({message:err.message});
    }
}

module.exports={
    getEquipmentList,
}