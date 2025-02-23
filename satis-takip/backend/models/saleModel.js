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
        required: true
    },
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
        enum: ['cash', 'cash-installment', 'installment'],
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
    }

    this.payments = payments;
};

// Ödeme durumunu güncelle
saleSchema.methods.updatePaymentStatus = function() {
    const now = new Date();
    let totalPaid = 0;
    let hasOverdue = false;
    let hasPending = false;

    this.payments.forEach(payment => {
        totalPaid += payment.paidAmount || 0;

        if (payment.status === 'pending') {
            hasPending = true;
            if (payment.dueDate < now) {
                payment.status = 'overdue';
                hasOverdue = true;
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
};

// Ödeme kaydedilmeden önce
saleSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.generatePaymentSchedule();
    }
    this.updatePaymentStatus();
    next();
});

export default mongoose.model('Sale', saleSchema);
