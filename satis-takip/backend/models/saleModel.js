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
    isPaid: {
        type: Boolean,
        default: false
    },
    paidDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        default: 0
    }
});

const saleSchema = mongoose.Schema({
    blockId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Block'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    type: {
        type: String,
        required: true,
        enum: ['reservation', 'sale']
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    totalAmount: {
        type: Number,
        required: function() { return this.type === 'sale'; }
    },
    paymentPlan: {
        type: String,
        enum: ['cash', 'cash-installment', 'installment'],
        required: function() { return this.type === 'sale'; }
    },
    downPayment: {
        type: Number,
        required: function() {
            return this.type === 'sale' && this.paymentPlan === 'cash-installment';
        }
    },
    installmentCount: {
        type: Number,
        required: function() {
            return this.type === 'sale' && 
                   (this.paymentPlan === 'cash-installment' || 
                    this.paymentPlan === 'installment');
        }
    },
    payments: [paymentSchema],
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
saleSchema.methods.createPaymentPlan = function(firstPaymentDate) {
    if (this.type !== 'sale') return;

    const payments = [];
    const paymentDate = new Date(firstPaymentDate);

    if (this.paymentPlan === 'cash') {
        // Peşin ödeme - tek ödeme planı
        payments.push({
            amount: this.totalAmount,
            dueDate: paymentDate
        });
    } else if (this.paymentPlan === 'cash-installment') {
        // Peşin + Vadeli
        // Peşinat ödemesi
        payments.push({
            amount: this.downPayment,
            dueDate: paymentDate
        });

        // Kalan tutar için taksitler
        const remainingAmount = this.totalAmount - this.downPayment;
        const installmentAmount = remainingAmount / this.installmentCount;

        for (let i = 0; i < this.installmentCount; i++) {
            const dueDate = new Date(paymentDate);
            dueDate.setMonth(paymentDate.getMonth() + i + 1);
            
            payments.push({
                amount: installmentAmount,
                dueDate: dueDate
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
                dueDate: dueDate
            });
        }
    }

    this.payments = payments;
};

export default mongoose.model('Sale', saleSchema);
