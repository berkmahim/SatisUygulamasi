import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    sendEmailNotifications,
    createTestNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getNotifications);

router.route('/:id/read')
    .put(markAsRead);

router.route('/mark-all-read')
    .put(markAllAsRead);

router.route('/archive')
    .put(archiveNotifications);

router.route('/send-emails')
    .post(sendEmailNotifications);

router.route('/test')
    .post(createTestNotification);

export default router;
