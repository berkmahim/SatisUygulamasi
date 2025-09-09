import express from 'express';
import {
  getLogs,
  getLogsByEntity,
  getLogStats,
  exportLogs,
  getLogDetail
} from '../controllers/logControllerPrisma.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Log routes - Activity log management permission required
router.route('/')
  .get(protect, checkPermission('activityLogManagement'), getLogs);

router.route('/stats')
  .get(protect, checkPermission('activityLogManagement'), getLogStats);

router.route('/export')
  .get(protect, checkPermission('activityLogManagement'), exportLogs);

router.route('/entity/:entityId')
  .get(protect, getLogsByEntity);

router.route('/:id')
  .get(protect, checkPermission('activityLogManagement'), getLogDetail);

export default router;