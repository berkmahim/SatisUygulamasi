import express from 'express';
import {
    getSalesStatistics,
    getMonthlySales,
    getPaymentStatusDistribution,
    getProjectSalesDistribution,
    getProjectStats
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/statistics', getSalesStatistics);
router.get('/monthly-sales', getMonthlySales);
router.get('/payment-status', getPaymentStatusDistribution);
router.get('/project-sales', getProjectSalesDistribution);
router.get('/projects/:projectId/stats', getProjectStats);

export default router;
