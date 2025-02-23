import express from 'express';
import {
    recordPayment,
    getPaymentDetails,
    updatePaymentDueDate,
    getOverduePayments,
    recordBulkPayments,
    updatePaymentPlan
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm route'ları koruma altına al
router.use(protect);

// Ödeme kaydetme
router.post('/:saleId', recordPayment);

// Ödeme detaylarını getirme
router.get('/:saleId', getPaymentDetails);

// Ödeme tarihini güncelleme
router.put('/:saleId/due-date', updatePaymentDueDate);

// Ödeme planını güncelleme
router.put('/:saleId/plan', updatePaymentPlan);

// Toplu ödeme kaydetme
router.post('/:saleId/bulk', recordBulkPayments);

// Gecikmiş ödemeleri getirme
router.get('/overdue', getOverduePayments);

export default router;
