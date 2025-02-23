import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['PAYMENT_OVERDUE', 'PAYMENT_RECEIVED', 'CUSTOMER_ADDED', 'SALE_COMPLETED'],
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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
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
    const users = await mongoose.model('User').find({
        $or: [
            { role: 'admin' },
            { permissions: 'PAYMENT_OVERDUE_NOTIFICATION' }
        ]
    });

    const notification = new this({
        type: 'PAYMENT_OVERDUE',
        title: 'Geciken Ödeme Bildirimi',
        message: `${customer.firstName} ${customer.lastName} müşterisinin ${payment.amount} TL tutarındaki ödemesi gecikmiştir.`,
        recipients: users.map(user => ({
            userId: user._id,
            read: false
        })),
        relatedData: {
            saleId: sale._id,
            customerId: customer._id,
            paymentId: payment._id,
            amount: payment.amount,
            dueDate: payment.dueDate
        },
        priority: 'high'
    });

    return notification.save();
};

export default mongoose.model('Notification', notificationSchema);
