import express from 'express';
import { getLogs, getLogTypes, exportLogs } from '../controllers/logController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm log route'ları activityLogManagement izni ile korumalı
router.use(protect);
router.use(checkPermission('activityLogManagement'));

// Logları getir
router.get('/', getLogs);

// Log tiplerini getir
router.get('/types', getLogTypes);

// Logları dışa aktar
router.get('/export', exportLogs);

export default router;
