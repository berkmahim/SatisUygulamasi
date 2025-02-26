import express from 'express';
import {
    getSalesStatistics,
    getMonthlySales,
    getPaymentStatusDistribution,
    getProjectSalesDistribution,
    getProjectStats,
    getUnitTypeDistribution,
    getProjectPayments
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Genel raporlar
router.get('/statistics', protect, getSalesStatistics);
router.get('/monthly-sales', protect, getMonthlySales);
router.get('/payment-status', protect, getPaymentStatusDistribution);
router.get('/project-sales', protect, getProjectSalesDistribution);

// Proje bazlı raporlar
router.get('/projects/:projectId/stats', protect, getProjectStats);
router.get('/projects/:projectId/unit-types', protect, getUnitTypeDistribution);
router.get('/projects/:projectId/payments', protect, getProjectPayments);

export default router;
