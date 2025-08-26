import express from 'express';
import {
  getLogs,
  getLogsByEntity,
  getLogStats,
  exportLogs,
  getLogDetail
} from '../controllers/logControllerPrisma.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Log routes - Admin only
router.route('/')
  .get(protect, admin, getLogs);

router.route('/stats')
  .get(protect, admin, getLogStats);

router.route('/export')
  .get(protect, admin, exportLogs);

router.route('/entity/:entityId')
  .get(protect, getLogsByEntity);

router.route('/:id')
  .get(protect, admin, getLogDetail);

export default router;