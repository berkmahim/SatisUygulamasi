import express from 'express';
import {
    createSale,
    getSaleById,
    updatePaymentPlan,
    getSales,
    cancelSale,
    getSalesByProject,
    cancelSaleAndRefund,
    getCancelledSales,
    getSalesByCustomerId,
    getSalesByBlockId,
    updateRefundStatus
} from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm route'ları koruma altına al
router.use(protect);

// Ana route'lar
router.post('/', createSale);
router.get('/', getSales);

// İptal edilen satışlar
router.get('/cancelled', getCancelledSales);

// Proje, müşteri ve blok bazlı satış sorguları
router.get('/project/:projectId', getSalesByProject);
router.get('/customer/:customerId', getSalesByCustomerId);
router.get('/block/:blockId', getSalesByBlockId);

// Tekil satış işlemleri
router.get('/:id', getSaleById);
router.put('/:id/payment-plan', updatePaymentPlan);
router.post('/:id/cancel', cancelSaleAndRefund);
router.put('/:id/update-refund', updateRefundStatus);
router.delete('/:id', cancelSale);

export default router;
