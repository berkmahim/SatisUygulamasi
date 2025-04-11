import express from 'express';
import { 
    getUserTasks, 
    getAllTasks, 
    getTaskById,
    createTask, 
    updateTask, 
    deleteTask, 
    processTaskReminders 
} from '../controllers/taskController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Kullanıcı görevlerini getir
router.route('/')
    .get(protect, getUserTasks)
    .post(protect, createTask);

// Tüm görevleri getir (admin/manager)
router.route('/all').get(protect, admin, getAllTasks);

// Hatırlatmaları işle
router.route('/process-reminders').get(protect, admin, processTaskReminders);

// Belirli bir görevi getir, güncelle veya sil
router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

export default router;
