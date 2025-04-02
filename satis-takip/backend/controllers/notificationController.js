import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import { sendNotificationEmail } from '../config/mailer.js';
import emailService from '../services/emailService.js';

// @desc    Kullanıcının bildirimlerini getir
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // all, unread, read

    let query = { 'recipients.userId': req.user._id };
    if (filter === 'unread') {
        query['recipients.read'] = false;
    } else if (filter === 'read') {
        query['recipients.read'] = true;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skipIndex)
        .lean();

    // Kullanıcı için bildirim sayıları
    const unreadCount = await Notification.countDocuments({
        'recipients.userId': req.user._id,
        'recipients.read': false
    });

    const totalCount = await Notification.countDocuments({
        'recipients.userId': req.user._id
    });

    res.json({
        notifications,
        unreadCount,
        totalCount,
        page,
        pages: Math.ceil(totalCount / limit)
    });
});

// @desc    Bildirimi okundu olarak işaretle
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Bildirim bulunamadı');
    }

    // Mevcut alıcıyı kontrol et ve güncelle
    const recipientIndex = notification.recipients.findIndex(
        r => r.userId.toString() === req.user._id.toString()
    );

    if (recipientIndex === -1) {
        res.status(404);
        throw new Error('Bu bildirim sizin için değil');
    }

    // Bildirim zaten okunmuşsa
    if (notification.recipients[recipientIndex].read) {
        return res.json({ message: 'Bildirim zaten okunmuş olarak işaretlenmiş', notification });
    }

    notification.recipients[recipientIndex].read = true;
    notification.recipients[recipientIndex].readAt = Date.now();

    await notification.save();

    res.json({ message: 'Bildirim okundu olarak işaretlendi', notification });
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

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
    const { type, title, message, recipientIds, priority, relatedData } = req.body;
    
    if (!type || !title || !message || !recipientIds || recipientIds.length === 0) {
        res.status(400);
        throw new Error('Tüm gerekli alanları doldurun');
    }
    
    // Alıcıları doğrula
    const recipients = recipientIds.map(id => ({
        userId: id,
        read: false
    }));
    
    const notification = await Notification.create({
        type,
        title,
        message,
        recipients,
        priority: priority || 'medium',
        relatedData: relatedData || {}
    });
    
    // E-posta gönderme
    if (notification) {
        // Admin kullanıcılarını bul
        const adminUsers = await User.find({ role: 'admin' });
        
        if (adminUsers && adminUsers.length > 0) {
            // E-posta gönder
            await sendNotificationEmail(notification, adminUsers);
            
            // E-posta gönderildi olarak işaretle
            for (const recipient of notification.recipients) {
                const user = adminUsers.find(u => u._id.toString() === recipient.userId.toString());
                if (user) {
                    recipient.emailSent = true;
                    recipient.emailSentAt = Date.now();
                }
            }
            
            await notification.save();
        }
    }
    
    res.status(201).json(notification);
});

// @desc    Get all notifications
// @route   GET /api/notifications/all
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    const notifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skipIndex);
    
    const totalCount = await Notification.countDocuments({});
    
    res.json({
        notifications,
        totalCount,
        page,
        pages: Math.ceil(totalCount / limit)
    });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
        res.status(404);
        throw new Error('Bildirim bulunamadı');
    }
    
    await notification.remove();
    
    res.json({ message: 'Bildirim silindi' });
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotifications,
    sendEmailNotifications,
    createTestNotification,
    createNotification,
    getAllNotifications,
    deleteNotification
};
