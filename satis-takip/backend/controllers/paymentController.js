import Sale from '../models/saleModel.js';

// @desc    Record a payment for a sale
// @route   POST /api/payments/:saleId
// @access  Public
const recordPayment = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const {
            paymentId,
            paidAmount,
            paidDate,
            paymentMethod,
            notes
        } = req.body;

        // Ödemeyi bul
        const payment = sale.payments.find(p => p._id.toString() === paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Ödeme tutarını güncelle
        payment.paidAmount = (payment.paidAmount || 0) + paidAmount;
        payment.paidDate = paidDate || new Date();
        payment.paymentMethod = paymentMethod;
        if (notes) payment.notes = notes;

        // Ödeme durumunu güncelle
        if (payment.paidAmount >= payment.amount) {
            payment.status = 'paid';
        } else if (payment.paidAmount > 0) {
            payment.status = 'partial';
        }

        payment.remainingAmount = payment.amount - payment.paidAmount;

        // Satışı kaydet ve populate et
        await sale.save();
        const updatedSale = await Sale.findById(sale._id)
            .populate('block', 'unitNumber type')
            .populate('customer', 'firstName lastName tcNo phone');

        res.json(updatedSale);
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get payment details for a sale
// @route   GET /api/payments/:saleId
// @access  Public
const getPaymentDetails = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId)
            .populate('block', 'unitNumber type')
            .populate('customer', 'firstName lastName tcNo phone');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Ödemeleri sırala
        sale.payments.sort((a, b) => a.installmentNumber - b.installmentNumber);

        res.json({
            totalAmount: sale.totalAmount,
            totalPaidAmount: sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
            remainingAmount: sale.totalAmount - sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
            paymentStatus: sale.paymentStatus,
            payments: sale.payments.map(payment => ({
                id: payment._id,
                description: payment.description,
                installmentNumber: payment.installmentNumber,
                amount: payment.amount,
                dueDate: payment.dueDate,
                paidAmount: payment.paidAmount || 0,
                remainingAmount: payment.amount - (payment.paidAmount || 0),
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                notes: payment.notes
            }))
        });
    } catch (error) {
        console.error('Error getting payment details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update payment due date
// @route   PUT /api/payments/:saleId/due-date
// @access  Public
const updatePaymentDueDate = async (req, res) => {
    try {
        const { paymentId, newDueDate } = req.body;

        const sale = await Sale.findById(req.params.saleId);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        const payment = sale.payments.find(p => p._id.toString() === paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.dueDate = new Date(newDueDate);
        await sale.save();

        res.json(sale);
    } catch (error) {
        console.error('Error updating payment due date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get overdue payments
// @route   GET /api/payments/overdue
// @access  Public
const getOverduePayments = async (req, res) => {
    try {
        const sales = await Sale.find({ paymentStatus: 'overdue' })
            .populate('block', 'unitNumber type')
            .populate('customer', 'firstName lastName tcNo phone');

        const overduePayments = sales.map(sale => ({
            saleId: sale._id,
            block: sale.block,
            customer: sale.customer,
            totalAmount: sale.totalAmount,
            remainingAmount: sale.remainingAmount,
            nextPaymentDate: sale.nextPaymentDate,
            nextPaymentAmount: sale.nextPaymentAmount,
            overduePayments: sale.payments.filter(p => p.status === 'overdue').map(payment => ({
                id: payment._id,
                amount: payment.amount,
                remainingAmount: payment.remainingAmount,
                dueDate: payment.dueDate,
                description: payment.description
            }))
        }));

        res.json(overduePayments);
    } catch (error) {
        console.error('Error getting overdue payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export {
    recordPayment,
    getPaymentDetails,
    updatePaymentDueDate,
    getOverduePayments
};
