import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    installmentNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'partial'],
        default: 'pending'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paidDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'credit_card', 'check'],
        required: function() {
            return this.status === 'paid' || this.status === 'partial';
        }
    },
    transactionId: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    remainingAmount: {
        type: Number,
        default: function() {
            return this.amount - (this.paidAmount || 0);
        }
    }
});

const saleSchema = new mongoose.Schema({
    payments: [paymentSchema], // Ödeme planlarını doğrudan saklamak için eklendi
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    blockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
        required: function() {
            return !this.isBulkSale; // blockId not required for bulk sales
        }
    },
    // Bulk sale support
    isBulkSale: {
        type: Boolean,
        default: false
    },
    bulkSaleBlocks: [{
        blockId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Block',
            required: true
        },
        unitPrice: {
            type: Number,
            required: true
        }
    }],
    bulkSaleId: {
        type: String,
        required: function() {
            return this.isBulkSale;
        }
    },
    // Array of all block IDs for bulk sales (for easier querying and display)
    blockIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block'
    }],
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    type: {
        type: String,
        enum: ['sale', 'reservation'],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    totalPaidAmount: {
        type: Number,
        default: 0
    },
    remainingAmount: {
        type: Number,
        default: function() {
            return this.totalAmount - (this.totalPaidAmount || 0);
        }
    },
    paymentPlan: {
        type: String,
        enum: ['cash', 'cash-installment', 'installment', 'balloon-payment'],
        required: true
    },
    downPayment: {
        type: Number
    },
    installmentCount: {
        type: Number
    },
    firstPaymentDate: {
        type: Date,
        required: true
    },
    payments: [paymentSchema],
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed'],
        default: 'active'
    },
    paymentStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'overdue', 'pending', 'partial', 'paid'],
        default: 'not_started'
    },
    cancellationDetails: {
        cancelledAt: {
            type: Date
        },
        reason: {
            type: String
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundDate: {
            type: Date
        },
        hasRefund: {
            type: Boolean,
            default: false
        }
    },
    lastPaymentDate: {
        type: Date
    },
    nextPaymentDate: {
        type: Date
    },
    nextPaymentAmount: {
        type: Number
    }
}, {
    timestamps: true
});

// Ödeme planı oluşturma
saleSchema.methods.generatePaymentSchedule = function() {
    // Eğer payments zaten varsa ve frontend'den gönderilmişse, onları kullan
    if (this._doc.payments && this._doc.payments.length > 0) {
        return;
    }

    const payments = [];
    const paymentDate = new Date(this.firstPaymentDate);

    if (this.paymentPlan === 'cash') {
        // Peşin ödeme
        payments.push({
            amount: this.totalAmount,
            dueDate: paymentDate,
            description: 'Peşin Ödeme',
            installmentNumber: 1,
            status: 'pending'
        });
    } else if (this.paymentPlan === 'cash-installment') {
        // Peşinat ödemesi
        payments.push({
            amount: this.downPayment,
            dueDate: paymentDate,
            description: 'Peşinat',
            installmentNumber: 1,
            status: 'pending'
        });

        // Taksitli ödemeler
        const remainingAmount = this.totalAmount - this.downPayment;
        const installmentAmount = remainingAmount / this.installmentCount;
        let dueDate = new Date(paymentDate);

        for (let i = 0; i < this.installmentCount; i++) {
            dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
            payments.push({
                amount: installmentAmount,
                dueDate: new Date(dueDate),
                description: `${i + 1}. Taksit`,
                installmentNumber: i + 2,
                status: 'pending'
            });
        }
    } else if (this.paymentPlan === 'installment') {
        // Sadece taksitli ödemeler
        const installmentAmount = this.totalAmount / this.installmentCount;
        let dueDate = new Date(paymentDate);

        for (let i = 0; i < this.installmentCount; i++) {
            payments.push({
                amount: installmentAmount,
                dueDate: new Date(dueDate),
                description: `${i + 1}. Taksit`,
                installmentNumber: i + 1,
                status: 'pending'
            });
            dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
        }
    } else if (this.paymentPlan === 'balloon-payment') {
        // Balon ödemeli plan
        const installmentAmount = this.totalAmount / this.installmentCount;
        let dueDate = new Date(paymentDate);

        for (let i = 0; i < this.installmentCount - 1; i++) {
            payments.push({
                amount: installmentAmount,
                dueDate: new Date(dueDate),
                description: `${i + 1}. Taksit`,
                installmentNumber: i + 1,
                status: 'pending'
            });
            dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
        }

        // Son ödeme (balon ödeme)
        payments.push({
            amount: this.totalAmount - (installmentAmount * (this.installmentCount - 1)),
            dueDate: new Date(dueDate),
            description: `Son Ödeme (Balon)`,
            installmentNumber: this.installmentCount,
            status: 'pending'
        });
    }

    this.payments = payments;
};

// Ödeme durumunu güncelle
saleSchema.methods.updatePaymentStatus = async function() {
    const now = new Date();
    let totalPaid = 0;
    let hasOverdue = false;
    let hasPending = false;
    let newlyOverduePayments = [];

    this.payments.forEach(payment => {
        totalPaid += payment.paidAmount || 0;

        if (payment.status === 'pending') {
            hasPending = true;
            
            // Vade tarihi bugün veya daha önceyse
            const dueDate = new Date(payment.dueDate);
            // Tarih karşılaştırmaları için saat bilgilerini sıfırla
            dueDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Eğer vade tarihi bugün veya öncesiyse
            if (dueDate <= today) {
                const oldStatus = payment.status;
                payment.status = 'overdue';
                hasOverdue = true;

                // Eğer durum yeni değiştiyse, bildirimleri oluşturmak için kaydet
                if (oldStatus !== 'overdue') {
                    newlyOverduePayments.push(payment);
                }
            }
        }
    });

    // Toplam ödeme durumunu güncelle
    if (totalPaid >= this.totalAmount) {
        this.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
        this.paymentStatus = hasOverdue ? 'overdue' : 'partial';
    } else {
        this.paymentStatus = hasOverdue ? 'overdue' : 'pending';
    }

    // Yeni geciken ödemeler için bildirim oluştur
    if (newlyOverduePayments.length > 0) {
        try {
            const customer = await mongoose.model('Customer').findById(this.customerId);
            const Notification = mongoose.model('Notification');

            for (const payment of newlyOverduePayments) {
                try {
                    await Notification.createPaymentOverdueNotification(payment, this, customer);
                } catch (error) {
                    console.error('Gecikmiş ödeme bildirimi oluşturma hatası:', error);
                    // Hatayı logluyoruz ama işlemi devam ettiriyoruz
                }
            }
        } catch (error) {
            console.error('Bildirim oluşturma işleminde genel hata:', error);
            // Hatayı logluyoruz ama işlemi devam ettiriyoruz
        }
    }
};

// Ödeme kaydedilmeden önce
saleSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.generatePaymentSchedule();
    }
    this.updatePaymentStatus();
    next();
});

// Her gün yarım saatte bir ödeme durumlarını kontrol et
setInterval(async () => {
    try {
        const sales = await mongoose.model('Sale').find({
            'payments.status': 'pending',
            status: 'active'
        }).populate('customerId blockId projectId');

        for (const sale of sales) {
            sale.updatePaymentStatus();
            // Skip validation during automatic updates to avoid required field errors
            await sale.save({ validateBeforeSave: false });
        }
    } catch (error) {
        console.error('Otomatik ödeme durumu güncelleme hatası:', error);
    }
}, 30 * 60 * 1000); // 30 dakika

export default mongoose.model('Sale', saleSchema);
