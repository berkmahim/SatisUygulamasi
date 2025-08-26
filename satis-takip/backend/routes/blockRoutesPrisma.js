import express from 'express';
import {
  getBlocksByProject,
  getBlock,
  createBlock,
  updateBlock,
  updateBlockPosition,
  deleteBlock,
  getBlocksForCanvas
} from '../controllers/blockControllerPrisma.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Block routes
router.route('/')
  .post(protect, createBlock);

router.route('/:id')
  .get(getBlock)
  .put(protect, updateBlock)
  .delete(protect, deleteBlock);

router.route('/:id/position')
  .put(protect, updateBlockPosition);

router.route('/project/:projectId')
  .get(getBlocksByProject);

router.route('/canvas/:projectId')
  .get(getBlocksForCanvas);

export default router;