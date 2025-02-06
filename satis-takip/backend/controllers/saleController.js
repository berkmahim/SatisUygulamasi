import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Customer from '../models/customerModel.js';

// @desc    Create a new sale or reservation
// @route   POST /api/sales
// @access  Public
const createSale = asyncHandler(async (req, res) => {
    const {
        blockId,
        customerId,
        type,
        totalAmount,
        paymentPlan,
        downPayment,
        installmentCount,
        firstPaymentDate,
        notes
    } = req.body;

    // Validate block and customer existence
    const block = await Block.findById(blockId);
    const customer = await Customer.findById(customerId);

    if (!block || !customer) {
        res.status(404);
        throw new Error('Block or customer not found');
    }

    // Check if block is already sold or reserved
    const existingSale = await Sale.findOne({
        blockId,
        status: 'active'
    });

    if (existingSale) {
        res.status(400);
        throw new Error('Block is already sold or reserved');
    }

    // Create sale/reservation
    const sale = new Sale({
        blockId,
        customerId,
        type,
        totalAmount,
        paymentPlan,
        downPayment,
        installmentCount,
        notes
    });

    // Generate payment plan if it's a sale
    if (type === 'sale' && firstPaymentDate) {
        sale.createPaymentPlan(firstPaymentDate);
    }

    const createdSale = await sale.save();
    res.status(201).json(createdSale);
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Public
const getSaleById = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id)
        .populate('blockId')
        .populate('customerId');

    if (sale) {
        res.json(sale);
    } else {
        res.status(404);
        throw new Error('Sale not found');
    }
});

// @desc    Update sale payment plan
// @route   PUT /api/sales/:id/payment-plan
// @access  Public
const updatePaymentPlan = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
    }

    // Update payment dates
    const { payments } = req.body;
    if (payments && Array.isArray(payments)) {
        sale.payments = payments.map(payment => ({
            ...payment,
            dueDate: new Date(payment.dueDate)
        }));
        
        const updatedSale = await sale.save();
        res.json(updatedSale);
    } else {
        res.status(400);
        throw new Error('Invalid payment plan data');
    }
});

// @desc    Record payment
// @route   PUT /api/sales/:id/payments/:paymentId
// @access  Public
const recordPayment = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
    }

    const payment = sale.payments.id(req.params.paymentId);
    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    const { paidAmount, paidDate } = req.body;
    payment.paidAmount = paidAmount;
    payment.paidDate = paidDate;
    payment.isPaid = paidAmount >= payment.amount;

    // Check if all payments are completed
    const allPaymentsMade = sale.payments.every(p => p.isPaid);
    if (allPaymentsMade) {
        sale.status = 'completed';
        sale.completedAt = new Date();
    }

    const updatedSale = await sale.save();
    res.json(updatedSale);
});

// @desc    Cancel sale
// @route   PUT /api/sales/:id/cancel
// @access  Public
const cancelSale = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
        res.status(404);
        throw new Error('Sale not found');
    }

    sale.status = 'cancelled';
    sale.cancelledAt = new Date();

    const updatedSale = await sale.save();
    res.json(updatedSale);
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = asyncHandler(async (req, res) => {
    const { blockId, customerId, type, status } = req.query;
    
    const filter = {};
    if (blockId) filter.blockId = blockId;
    if (customerId) filter.customerId = customerId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const sales = await Sale.find(filter)
        .populate('blockId')
        .populate('customerId')
        .sort('-createdAt');

    res.json(sales);
});

export {
    createSale,
    getSaleById,
    updatePaymentPlan,
    recordPayment,
    cancelSale,
    getSales
};
