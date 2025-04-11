import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['PAYMENT_OVERDUE', 'PAYMENT_RECEIVED', 'CUSTOMER_ADDED', 'SALE_COMPLETED', 'TASK_UPDATED'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipients: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        read: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date
        },
        emailSent: {
            type: Boolean,
            default: false
        },
        emailSentAt: {
            type: Date
        }
    }],
    relatedData: {
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sale'
        },
        customerId: {
            type: mongoose.Schema.Types.Mixed, // ObjectId veya String kabul edebilir
            ref: 'Customer'
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        amount: Number,
        dueDate: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Bildirim oluşturma yardımcı metodu
notificationSchema.statics.createPaymentOverdueNotification = async function(payment, sale, customer) {
    // Eğer müşteri veya müşteri bilgileri yoksa
    if (!customer) {
        console.log('Bildirim oluşturulamadı: Müşteri bilgisi bulunamadı');
        return null;
    }

    const users = await mongoose.model('User').find({
        $or: [
            { role: 'admin' },
            { 'permissions.paymentOverdueNotification': true }
        ]
    });

    // Eğer kullanıcı yoksa
    if (!users || users.length === 0) {
        console.log('Bildirim oluşturulamadı: Bildirim alacak kullanıcı bulunamadı');
        return null;
    }

    const customerName = customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Bilinmeyen Müşteri';
    
    const notification = new this({
        type: 'PAYMENT_OVERDUE',
        title: 'Geciken Ödeme Bildirimi',
        message: `${customerName} müşterisinin ${payment.amount} TL tutarındaki ödemesi gecikmiştir.`,
        recipients: users.map(user => ({
            userId: user._id,
            read: false
        })),
        relatedData: {
            saleId: sale._id,
            customerId: customer ? customer._id : null,
            paymentId: payment._id,
            amount: payment.amount,
            dueDate: payment.dueDate
        },
        priority: 'high'
    });

    return notification.save();
};

// Görev güncellendi bildirimi oluşturma metodu
notificationSchema.statics.createTaskUpdatedNotification = async function(task, updatedBy) {
    try {
        // Görev atanan kişi güncellemeyi yapan kişi değilse bildirimi onlara gönder
        if (task.assignedTo.toString() !== updatedBy._id.toString()) {
            const notification = await this.create({
                type: 'TASK_UPDATED',
                title: 'Görev Güncellendi',
                message: `"${task.title}" başlıklı göreviniz ${updatedBy.fullName || updatedBy.username} tarafından güncellendi.`,
                recipients: [
                    {
                        userId: task.assignedTo,
                        read: false
                    }
                ],
                relatedData: {
                    taskId: task._id
                },
                priority: 'medium'
            });
            
            return notification;
        }
        return null;
    } catch (error) {
        console.error('Görev güncelleme bildirimi oluşturulurken hata:', error);
        return null;
    }
};

// Görev durumu değiştiğinde bildirimi oluşturma metodu
notificationSchema.statics.createTaskStatusChangedNotification = async function(task, statusChangedBy, oldStatus) {
    try {
        // Durumu değiştiren kişi, görevi oluşturan kişi değilse bildirimi oluşturana gönder
        if (task.createdBy.toString() !== statusChangedBy._id.toString()) {
            // Durum değişikliğini okunabilir metne dönüştür
            const statusTexts = {
                'pending': 'Beklemede',
                'in_progress': 'Devam Ediyor',
                'completed': 'Tamamlandı',
                'cancelled': 'İptal Edildi'
            };

            const oldStatusText = statusTexts[oldStatus] || oldStatus;
            const newStatusText = statusTexts[task.status] || task.status;

            const notification = await this.create({
                type: 'TASK_UPDATED',
                title: 'Görev Durumu Değiştirildi',
                message: `${statusChangedBy.fullName || statusChangedBy.username} tarafından "${task.title}" başlıklı görevin durumu "${oldStatusText}" durumundan "${newStatusText}" durumuna güncellendi.`,
                recipients: [
                    {
                        userId: task.createdBy,
                        read: false
                    }
                ],
                relatedData: {
                    taskId: task._id
                },
                priority: 'medium'
            });
            
            return notification;
        }
        return null;
    } catch (error) {
        console.error('Görev durumu değişikliği bildirimi oluşturulurken hata:', error);
        return null;
    }
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
