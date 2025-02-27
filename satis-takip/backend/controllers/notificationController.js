import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';
import emailService from '../services/emailService.js';

// @desc    Kullanıcının bildirimlerini getir
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || 'all'; // all, unread, read

    let query = { 'recipients.userId': req.user._id };
    if (filter === 'unread') {
        query['recipients.read'] = false;
    } else if (filter === 'read') {
        query['recipients.read'] = true;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Toplam okunmamış bildirim sayısını getir
    const unreadCount = await Notification.countDocuments({
        'recipients.userId': req.user._id,
        'recipients.read': false
    });

    res.json({
        notifications,
        unreadCount,
        page,
        pages: Math.ceil(notifications.length / limit)
    });
});

// @desc    Bildirimi okundu olarak işaretle
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: req.params.id,
            'recipients.userId': req.user._id
        },
        {
            $set: {
                'recipients.$.read': true,
                'recipients.$.readAt': new Date()
            }
        },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Bildirim bulunamadı');
    }

    res.json(notification);
});

// @desc    Tüm bildirimleri okundu olarak işaretle
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            'recipients.userId': req.user._id,
            'recipients.read': false
        },
        {
            $set: {
                'recipients.$[elem].read': true,
                'recipients.$[elem].readAt': new Date()
            }
        },
        {
            arrayFilters: [{ 'elem.userId': req.user._id }],
            multi: true
        }
    );

    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
});

// @desc    Bildirimleri arşivle
// @route   PUT /api/notifications/archive
// @access  Private
const archiveNotifications = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;

    await Notification.updateMany(
        {
            _id: { $in: notificationIds },
            'recipients.userId': req.user._id
        },
        {
            $set: {
                'recipients.$[elem].archived': true,
                'recipients.$[elem].archivedAt': new Date()
            }
        },
        {
            arrayFilters: [{ 'elem.userId': req.user._id }],
            multi: true
        }
    );

    res.json({ message: 'Seçilen bildirimler arşivlendi' });
});

// @desc    E-posta bildirimlerini gönder
// @route   POST /api/notifications/send-emails
// @access  Private
const sendEmailNotifications = asyncHandler(async (req, res) => {
    const { notificationId } = req.body;
    const notification = await Notification.findById(notificationId)
        .populate('recipients.userId', 'email firstName lastName')
        .populate('relatedData.customerId', 'firstName lastName');

    if (!notification) {
        res.status(404);
        throw new Error('Bildirim bulunamadı');
    }

    for (const recipient of notification.recipients) {
        if (!recipient.emailSent) {
            await emailService.sendPaymentOverdueEmail(recipient.userId, notification);
            
            // E-posta gönderildi olarak işaretle
            recipient.emailSent = true;
            recipient.emailSentAt = new Date();
        }
    }

    await notification.save();
    res.json({ message: 'E-posta bildirimleri gönderildi' });
});

// @desc    Test bildirimi oluştur
// @route   POST /api/notifications/test
// @access  Private
const createTestNotification = asyncHandler(async (req, res) => {
    const notification = new Notification({
        type: 'PAYMENT_OVERDUE',
        title: 'Test Bildirimi',
        message: 'Bu bir test bildirimidir. Ödeme tarihi geçen müşteri: Ahmet Yılmaz',
        recipients: [{
            userId: req.user._id,
            read: false
        }],
        relatedData: {
            customerId: req.user._id, // Test için user ID'yi kullanıyoruz
            amount: 5000,
            dueDate: new Date()
        },
        priority: 'high'
    });

    await notification.save();
    res.status(201).json(notification);
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    sendEmailNotifications,
    createTestNotification
};
