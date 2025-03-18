const{sql,getPool}=require('../config/dbconfig');
const {request} = require("express");


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

        console.log(req.body || null);

        let stage = 1;

        if (data.amountReceived) {
            stage = 14;
        } else if (data.invoiceSubmittedByNtcpwc) {
            stage = 13;
        } else if (data.installedAtPort) {
            stage = 12;
        } else if (data.suppliedAtPort) {
            stage = 11;
        } else if (data.paymentSettledToVendorByNtcpwc) {
            stage = 10;
        } else if (data.equipmentDeliveredAtNtcpwc) {
            stage = 9;
        } else if (data.poReleased) {
            stage = 8;
        } else if (data.adminApproved) {
            stage = 7;
        } else if (data.intendRaised) {
            stage = 6;
        } else if (data.vendorReceivedQuotation) {
            stage = 5;
        } else if (data.vendorFinalised) {
            stage = 2;
        }

        const procurementResult = await pool.request()
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

        const procurementID = procurementResult.recordset[0].procurement_id;


        let check = await pool.request()
            .input('equipment_id',sql.Int,data.equipmentID)
            .query(`
            SELECT * FROM tbl_equipment_delivery WHERE equipment_id = @equipment_id;
        `);

        if (check.recordset.length > 0) {

            await request
                .input('equipment_id', sql.Int, data.equipmentID)
                .input('supplied_at_port', sql.Date, data.suppliedAtPort || null)
                .input('installed_at_port', sql.Date, data.installedAtPort || null)
                .input('stage',sql.Int,stage||1)
                .query(`
                    UPDATE tbl_equipment_delivery
                    SET supplied_at_port = @supplied_at_port, installed_at_port = @installed_at_port,stage_id = @stage
                    WHERE equipment_id = @equipment_id;
                `);
        } else {

            await request
                .input('equipment_id', sql.Int, data.equipmentID)
                .input('supplied_at_port', sql.Date, data.suppliedAtPort || null)
                .input('installed_at_port', sql.Date, data.installedAtPort || null)
                .input('stage',sql.Int,stage||1)
                .query(`
            INSERT INTO tbl_equipment_delivery (equipment_id, supplied_at_port, installed_at_port,stage_id)
            VALUES (@equipment_id, @supplied_at_port, @installed_at_port,@stage);
        `);
        }


        res.status(201).json({ success: true, procurementID });
    } catch (error) {
        console.error("Error in createProcurement:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}




// async function updateProcurement(req, res) {
//     const transaction = new sql.Transaction(pool);
//
//     try {
//         await transaction.begin();
//         const procurementID = req.params.id;
//         const data = req.body;
//
//         // console.log(data);
//
//         let query = 'UPDATE tbl_procurement_status SET ';
//         let deliveryQuery = 'UPDATE tbl_equipment_delivery SET ';
//         let updates = [];
//         let deliveryUpdates = [];
//         let request = transaction.request();
//
//         if (data.equipmentID !== undefined) {
//             updates.push('equipment_id = @equipment_id');
//             request.input('equipment_id', sql.Int, data.equipmentID);
//         }
//         if (data.vendorFinalised !== undefined) {
//             updates.push('vendor_finalised = @vendor_finalised');
//             request.input('vendor_finalised', sql.Date, data.vendorFinalised ? new Date(data.vendorFinalised) : null);
//         }
//         if (data.vendorReceivedQuotation !== undefined) {
//             updates.push('vendor_received_quotation = @vendor_received_quotation');
//             request.input('vendor_received_quotation', sql.Date, data.vendorReceivedQuotation ? new Date(data.vendorReceivedQuotation) : null);
//         }
//         if (data.intendRaised !== undefined) {
//             updates.push('intend_raised = @intend_raised');
//             request.input('intend_raised', sql.Date, data.intendRaised ? new Date(data.intendRaised) : null);
//         }
//         if (data.adminApproved !== undefined) {
//             updates.push('admin_approved = @admin_approved');
//             request.input('admin_approved', sql.Date, data.adminApproved ? new Date(data.adminApproved) : null);
//         }
//         if (data.poReleased !== undefined) {
//             updates.push('po_released = @po_released');
//             request.input('po_released', sql.Date, data.poReleased ? new Date(data.poReleased) : null);
//         }
//         if (data.equipmentDeliveredAtNtcpwc !== undefined) {
//             updates.push('equipment_delivered_at_ntcpwc = @equipment_delivered_at_ntcpwc');
//             request.input('equipment_delivered_at_ntcpwc', sql.Date, data.equipmentDeliveredAtNtcpwc ? new Date(data.equipmentDeliveredAtNtcpwc) : null);
//         }
//         if (data.paymentSettledToVendorByNtcpwc !== undefined) {
//             updates.push('payment_settled_to_vendor_by_ntcpwc = @payment_settled_to_vendor_by_ntcpwc');
//             request.input('payment_settled_to_vendor_by_ntcpwc', sql.Date, data.paymentSettledToVendorByNtcpwc ? new Date(data.paymentSettledToVendorByNtcpwc) : null);
//         }
//         if (data.invoiceSubmittedByNtcpwc !== undefined) {
//             updates.push('invoice_submitted_by_ntcpwc = @invoice_submitted_by_ntcpwc');
//             request.input('invoice_submitted_by_ntcpwc', sql.Date, data.invoiceSubmittedByNtcpwc ? new Date(data.invoiceSubmittedByNtcpwc) : null);
//         }
//         if (data.amountPaid !== undefined) {
//             updates.push('amount_paid = @amount_paid');
//             request.input('amount_paid', sql.Float, data.amountPaid ?? null);
//         }
//         if (data.gst !== undefined) {
//             updates.push('gst = @gst');
//             request.input('gst', sql.Float, data.gst ?? null);
//         }
//         if (data.totalAmountPaid !== undefined) {
//             updates.push('total_amount_paid = @total_amount_paid');
//             request.input('total_amount_paid', sql.Float, data.totalAmountPaid ?? null);
//         }
//         if (data.amountReceived !== undefined) {
//             updates.push('amount_received = @amount_received');
//             request.input('amount_received', sql.Float, data.amountReceived ?? null);
//         }
//
//
//             deliveryUpdates.push('supplied_at_port = @supplied_at_port');
//             request.input('supplied_at_port', sql.Date, data.suppliedAtPort ? new Date(data.suppliedAtPort) : null);
//
//
//             deliveryUpdates.push('installed_at_port = @installed_at_port');
//             request.input('installed_at_port', sql.Date, data.installedAtPort ? new Date(data.installedAtPort) : null);
//
//
//         if (updates.length > 0) {
//             query += updates.join(', ') + ' WHERE procurement_id = @procurement_id';
//             request.input('procurement_id', sql.Int, procurementID);
//
//             const result = await request.query(query);
//             if (result.rowsAffected[0] === 0) {
//                 await transaction.rollback();
//                 return res.status(404).json({ success: false, message: 'Procurement not found' });
//             }
//         }
//
//         if (deliveryUpdates.length > 0) {
//             deliveryQuery += deliveryUpdates.join(', ') + ' WHERE equipment_id = @equipment_id';
//
//             const deliveryResult = await request.query(deliveryQuery);
//             if (deliveryResult.rowsAffected[0] === 0) {
//                 await transaction.rollback();
//                 return res.status(403).send({ message: 'Can\'t update delivery record' });
//             }
//         }
//
//         await transaction.commit();
//         res.status(200).json({ success: true, message: 'Procurement updated successfully' });
//
//     } catch (error) {
//         await transaction.rollback();
//         console.error("Error in updateProcurement:", error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// }

async function updateProcurement(req, res) {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const procurementID = req.params.id;
        const data = req.body;

        let query = 'UPDATE tbl_procurement_status SET ';
        let deliveryQuery = 'UPDATE tbl_equipment_delivery SET ';
        let updates = [];
        let deliveryUpdates = [];
        let request = transaction.request();

        if (data.equipmentID !== undefined) {
            updates.push('equipment_id = @equipment_id');
            request.input('equipment_id', sql.Int, data.equipmentID);
        }
        if (data.vendorFinalised !== undefined) {
            updates.push('vendor_finalised = @vendor_finalised');
            request.input('vendor_finalised', sql.Date, data.vendorFinalised ? new Date(data.vendorFinalised) : null);
        }
        if (data.vendorReceivedQuotation !== undefined) {
            updates.push('vendor_received_quotation = @vendor_received_quotation');
            request.input('vendor_received_quotation', sql.Date, data.vendorReceivedQuotation ? new Date(data.vendorReceivedQuotation) : null);
        }
        if (data.intendRaised !== undefined) {
            updates.push('intend_raised = @intend_raised');
            request.input('intend_raised', sql.Date, data.intendRaised ? new Date(data.intendRaised) : null);
        }
        if (data.adminApproved !== undefined) {
            updates.push('admin_approved = @admin_approved');
            request.input('admin_approved', sql.Date, data.adminApproved ? new Date(data.adminApproved) : null);
        }
        if (data.poReleased !== undefined) {
            updates.push('po_released = @po_released');
            request.input('po_released', sql.Date, data.poReleased ? new Date(data.poReleased) : null);
        }
        if (data.equipmentDeliveredAtNtcpwc !== undefined) {
            updates.push('equipment_delivered_at_ntcpwc = @equipment_delivered_at_ntcpwc');
            request.input('equipment_delivered_at_ntcpwc', sql.Date, data.equipmentDeliveredAtNtcpwc ? new Date(data.equipmentDeliveredAtNtcpwc) : null);
        }
        if (data.paymentSettledToVendorByNtcpwc !== undefined) {
            updates.push('payment_settled_to_vendor_by_ntcpwc = @payment_settled_to_vendor_by_ntcpwc');
            request.input('payment_settled_to_vendor_by_ntcpwc', sql.Date, data.paymentSettledToVendorByNtcpwc ? new Date(data.paymentSettledToVendorByNtcpwc) : null);
        }
        if (data.invoiceSubmittedByNtcpwc !== undefined) {
            updates.push('invoice_submitted_by_ntcpwc = @invoice_submitted_by_ntcpwc');
            request.input('invoice_submitted_by_ntcpwc', sql.Date, data.invoiceSubmittedByNtcpwc ? new Date(data.invoiceSubmittedByNtcpwc) : null);
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

        deliveryUpdates.push('supplied_at_port = @supplied_at_port');
        request.input('supplied_at_port', sql.Date, data.suppliedAtPort ? new Date(data.suppliedAtPort) : null);

        deliveryUpdates.push('installed_at_port = @installed_at_port');
        request.input('installed_at_port', sql.Date, data.installedAtPort ? new Date(data.installedAtPort) : null);


        let stage = 1;

        if (data.amountReceived) {
            stage = 14;
        } else if (data.invoiceSubmittedByNtcpwc) {
            stage = 13;
        } else if (data.installedAtPort) {
            stage = 12;
        } else if (data.suppliedAtPort) {
            stage = 11;
        } else if (data.paymentSettledToVendorByNtcpwc) {
            stage = 10;
        } else if (data.equipmentDeliveredAtNtcpwc) {
            stage = 9;
        } else if (data.poReleased) {
            stage = 8;
        } else if (data.adminApproved) {
            stage = 7;
        } else if (data.intendRaised) {
            stage = 6;
        } else if (data.vendorReceivedQuotation) {
            stage = 5;
        } else if (data.vendorFinalised) {
            stage = 2;
        }

        deliveryUpdates.push('stage_id = @stage');
        request.input('stage', sql.Int, stage);

        if (updates.length > 0) {
            query += updates.join(', ') + ' WHERE procurement_id = @procurement_id';
            request.input('procurement_id', sql.Int, procurementID);

            const result = await request.query(query);
            if (result.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Procurement not found' });
            }
        }

        if (deliveryUpdates.length > 0) {
            deliveryQuery += deliveryUpdates.join(', ') + ' WHERE equipment_id = @equipment_id';

            const deliveryResult = await request.query(deliveryQuery);
            if (deliveryResult.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(403).send({ message: 'Can\'t update delivery record' });
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Procurement updated successfully', stage });

    } catch (error) {
        await transaction.rollback();
        console.error("Error in updateProcurement:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}




module.exports={
    createProcurement,
    updateProcurement
}