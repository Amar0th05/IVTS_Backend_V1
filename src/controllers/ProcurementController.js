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


async function createProcurement(req, res) {
    try {
        const data = req.body;

        const result = await pool.request()
            .input('equipment_id', sql.Int, data.equipmentID)
            .input('vendor_finalised', sql.Date, data.vendorFinalised || null)
            .input('vendor_received_quotation', sql.Date, data.vendorReceivedQuotation || null)
            .input('intend_raised', sql.Date, data.intendRaised || null)
            .input('admin_approved', sql.Date, data.adminApproved || null)
            .input('po_released', sql.Date, data.poReleased || null)
            .input('equipment_delivered_at_ntcpwc', sql.Date, data.equipmentDeliveredAtNtcpwc || null)
            .input('payment_settled_to_vendor_by_ntcpwc', sql.Date, data.paymentSettledToVendorByNtcpwc || null)
            .input('invoice_submitted_by_ntcpwc', sql.Date, data.invoiceSubmittedByNtcpwc || null)
            .input('amount_paid', sql.Float, data.amountPaid ?? null)
            .input('gst', sql.Float, data.gst ?? null)
            .input('total_amount_paid', sql.Float, data.totalAmountPaid ?? null)
            .input('amount_received', sql.Float, data.amountReceived ?? null)
            .query(`
                INSERT INTO tbl_procurement_status (
                    equipment_id, vendor_finalised, vendor_received_quotation, intend_raised, 
                    admin_approved, po_released, equipment_delivered_at_ntcpwc, 
                    payment_settled_to_vendor_by_ntcpwc, invoice_submitted_by_ntcpwc, 
                    amount_paid, gst, total_amount_paid, amount_received
                ) 
                OUTPUT INSERTED.procurement_id 
                VALUES (
                    @equipment_id, @vendor_finalised, @vendor_received_quotation, @intend_raised, 
                    @admin_approved, @po_released, @equipment_delivered_at_ntcpwc, 
                    @payment_settled_to_vendor_by_ntcpwc, @invoice_submitted_by_ntcpwc, 
                    @amount_paid, @gst, @total_amount_paid, @amount_received
                )
            `);

        res.status(201).json({ success: true, procurementID: result.recordset[0].procurement_id });
    } catch (error) {
        console.error("Error in createProcurement:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}



async function updateProcurement(req, res) {
    try {
        const procurementID = req.params.id;
        const data = req.body;

        let query = 'UPDATE tbl_procurement_status SET ';
        let updates = [];
        let request = pool.request();

        if (data.equipmentID !== undefined) {
            updates.push('equipment_id = @equipment_id');
            request.input('equipment_id', sql.Int, data.equipmentID);
        }
        if (data.vendorFinalised !== undefined) {
            updates.push('vendor_finalised = @vendor_finalised');
            request.input('vendor_finalised', sql.Date, data.vendorFinalised || null);
        }
        if (data.vendorReceivedQuotation !== undefined) {
            updates.push('vendor_received_quotation = @vendor_received_quotation');
            request.input('vendor_received_quotation', sql.Date, data.vendorReceivedQuotation || null);
        }
        if (data.intendRaised !== undefined) {
            updates.push('intend_raised = @intend_raised');
            request.input('intend_raised', sql.Date, data.intendRaised || null);
        }
        if (data.adminApproved !== undefined) {
            updates.push('admin_approved = @admin_approved');
            request.input('admin_approved', sql.Date, data.adminApproved || null);
        }
        if (data.poReleased !== undefined) {
            updates.push('po_released = @po_released');
            request.input('po_released', sql.Date, data.poReleased || null);
        }
        if (data.equipmentDeliveredAtNtcpwc !== undefined) {
            updates.push('equipment_delivered_at_ntcpwc = @equipment_delivered_at_ntcpwc');
            request.input('equipment_delivered_at_ntcpwc', sql.Date, data.equipmentDeliveredAtNtcpwc || null);
        }
        if (data.paymentSettledToVendorByNtcpwc !== undefined) {
            updates.push('payment_settled_to_vendor_by_ntcpwc = @payment_settled_to_vendor_by_ntcpwc');
            request.input('payment_settled_to_vendor_by_ntcpwc', sql.Date, data.paymentSettledToVendorByNtcpwc || null);
        }
        if (data.invoiceSubmittedByNtcpwc !== undefined) {
            updates.push('invoice_submitted_by_ntcpwc = @invoice_submitted_by_ntcpwc');
            request.input('invoice_submitted_by_ntcpwc', sql.Date, data.invoiceSubmittedByNtcpwc || null);
        }
        if (data.amountPaid !== undefined) {
            updates.push('amount_paid = @amount_paid');
            request.input('amount_paid', sql.Float, data.amountPaid ?? null);
        }
        if (data.gst !== undefined) {
            updates.push('gst = @gst');
            request.input('gst', sql.Float, data.gst ?? null);
        }
        if (data.totalAmountPaid !== undefined) {
            updates.push('total_amount_paid = @total_amount_paid');
            request.input('total_amount_paid', sql.Float, data.totalAmountPaid ?? null);
        }
        if (data.amountReceived !== undefined) {
            updates.push('amount_received = @amount_received');
            request.input('amount_received', sql.Float, data.amountReceived ?? null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        query += updates.join(', ') + ' WHERE procurement_id = @procurement_id';
        request.input('procurement_id', sql.Int, procurementID);

        const result = await request.query(query);

        res.status(200).json({ success: true, message: 'Procurement updated successfully', affectedRows: result.rowsAffected[0] });
    } catch (error) {
        console.error("Error in updateProcurement:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}




module.exports={
    createProcurement,
    updateProcurement
}