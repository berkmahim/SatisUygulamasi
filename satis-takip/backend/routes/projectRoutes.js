import express from 'express';
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject
} from '../controllers/projectController.js';
import { protect, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, checkPermission('projectManagement'), getProjects)
    .post(protect, checkPermission('projectManagement'), createProject);

router.route('/:id')
    .get(protect, checkPermission('projectManagement'), getProject)
    .put(protect, checkPermission('projectManagement'), updateProject)
    .delete(protect, checkPermission('projectManagement'), deleteProject);

export default router;
