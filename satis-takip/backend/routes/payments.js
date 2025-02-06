import express from 'express';
import {
    recordPayment,
    getPaymentDetails,
    updatePaymentDueDate,
    getOverduePayments
} from '../controllers/paymentController.js';

const router = express.Router();

// Ödeme kaydetme
router.post('/:saleId', recordPayment);

// Ödeme detaylarını getirme
router.get('/:saleId', getPaymentDetails);

// Ödeme tarihini güncelleme
router.put('/:saleId/due-date', updatePaymentDueDate);

// Gecikmiş ödemeleri getirme
router.get('/overdue', getOverduePayments);

export default router;
