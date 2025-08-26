import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} from '../controllers/projectControllerPrisma.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (you may want to add authentication later)
router.route('/')
  .get(getProjects)
  .post(protect, createProject);

router.route('/:id')
  .get(getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

router.route('/:id/stats')
  .get(protect, getProjectStats);

export default router;