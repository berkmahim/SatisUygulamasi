import express from 'express';
import {
    createSale,
    getSaleById,
    updatePaymentPlan,
    getSales,
    cancelSale,
    getSalesByProject,
    cancelSaleAndRefund,
    getCancelledSales
} from '../controllers/saleController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/', getSales);
router.get('/cancelled', getCancelledSales);
router.get('/project/:projectId', getSalesByProject);
router.get('/:id', getSaleById);
router.put('/:id/payment-plan', updatePaymentPlan);
router.post('/:id/cancel', cancelSaleAndRefund);
router.delete('/:id', cancelSale);

export default router;
