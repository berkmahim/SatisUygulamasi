import express from 'express';
import { getLogs, getLogTypes, exportLogs } from '../controllers/logController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm log route'ları admin korumalı
router.use(protect);
router.use(admin);

// Logları getir
router.get('/', getLogs);

// Log tiplerini getir
router.get('/types', getLogTypes);

// Logları dışa aktar
router.get('/export', exportLogs);

export default router;
