import express from 'express';
import {
    getSalesStatistics,
    getMonthlySales,
    getPaymentStatusDistribution,
    getProjectSalesDistribution,
    getProjectStats,
    getUnitTypeDistribution,
    getProjectPayments,
    getGlobalUnitTypeDistribution,
    getGlobalMonthlySales,
    getGlobalPaymentData
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

// Global raporlar - Tüm projelerin ortak verileri
router.get('/global/unit-types', protect, getGlobalUnitTypeDistribution);
router.get('/global/monthly-sales', protect, getGlobalMonthlySales);
router.get('/global/payments', protect, getGlobalPaymentData);

export default router;
