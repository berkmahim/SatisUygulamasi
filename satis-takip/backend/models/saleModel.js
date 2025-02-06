import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema({
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
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    paidDate: {
        type: Date
    }
});

const saleSchema = mongoose.Schema({
    block: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
        required: true
    },
    customer: {
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
        enum: ['active', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    notes: String
}, {
    timestamps: true
});

// Ödeme planı oluşturma methodu
saleSchema.methods.createPaymentPlan = function() {
    if (this.type !== 'sale') return;

    const payments = [];
    const paymentDate = new Date(this.firstPaymentDate);

    if (this.paymentPlan === 'cash') {
        // Peşin ödeme - tek ödeme planı
        payments.push({
            amount: this.totalAmount,
            dueDate: paymentDate,
            description: 'Peşin Ödeme'
        });
    } else if (this.paymentPlan === 'cash-installment') {
        // Peşin + Vadeli
        // Peşinat ödemesi
        payments.push({
            amount: this.downPayment,
            dueDate: paymentDate,
            description: 'Peşinat Ödemesi'
        });

        // Kalan tutar için taksitler
        const remainingAmount = this.totalAmount - this.downPayment;
        const installmentAmount = remainingAmount / this.installmentCount;

        for (let i = 0; i < this.installmentCount; i++) {
            const dueDate = new Date(paymentDate);
            dueDate.setMonth(paymentDate.getMonth() + i + 1);
            
            payments.push({
                amount: installmentAmount,
                dueDate: dueDate,
                description: `Taksit ${i+1}`
            });
        }
    } else if (this.paymentPlan === 'installment') {
        // Vadeli - tüm tutar taksitlere bölünür
        const installmentAmount = this.totalAmount / this.installmentCount;

        for (let i = 0; i < this.installmentCount; i++) {
            const dueDate = new Date(paymentDate);
            dueDate.setMonth(paymentDate.getMonth() + i);
            
            payments.push({
                amount: installmentAmount,
                dueDate: dueDate,
                description: `Taksit ${i+1}`
            });
        }
    }

    this.payments = payments;
};

export default mongoose.model('Sale', saleSchema);
