import express from 'express';
import {
    createSale,
    getSaleById,
    updatePaymentPlan,
    recordPayment,
    cancelSale,
    getSales,
    getSalesByProject
} from '../controllers/saleController.js';

const router = express.Router();

router.route('/')
    .post(createSale)
    .get(getSales);

router.route('/project/:projectId')
    .get(getSalesByProject);

router.route('/:id')
    .get(getSaleById);

router.route('/:id/payment-plan')
    .put(updatePaymentPlan);

router.route('/:id/payments/:paymentId')
    .put(recordPayment);

router.route('/:id/cancel')
    .put(cancelSale);

export default router;
