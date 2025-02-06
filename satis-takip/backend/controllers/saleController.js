import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Customer from '../models/customerModel.js';

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Public
const createSale = asyncHandler(async (req, res) => {
    try {
        console.log('Creating sale with data:', req.body);

        const {
            blockId,
            customerId,
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate
        } = req.body;

        // Blok'u bul ve kontrol et
        const block = await Block.findById(blockId);
        if (!block) {
            return res.status(404).json({ message: 'Block not found' });
        }
        console.log('Found block:', block);

        // Yeni satış oluştur
        const sale = new Sale({
            block: blockId,
            customer: customerId,
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate: new Date(firstPaymentDate)
        });

        // Ödeme planını oluştur
        sale.generatePaymentSchedule();

        // Satışı kaydet
        const savedSale = await sale.save();
        console.log('Sale saved:', savedSale);

        // Blok'u güncelle
        block.status = type === 'sale' ? 'sold' : 'reserved';
        await block.save();

        const populatedSale = await Sale.findById(savedSale._id)
            .populate('block', 'unitNumber type projectId')
            .populate('customer', 'firstName lastName tcNo phone');

        res.status(201).json(populatedSale);
    } catch (error) {
        console.warn('Error creating sale:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Public
const getSaleById = asyncHandler(async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('block', 'unitNumber type projectId')
            .populate('customer', 'firstName lastName tcNo phone');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        console.log('Found sale:', sale);

        res.json(sale);
    } catch (error) {
        console.error('Error getting sale:', error);
        res.status(500).json({ message: 'Server error' });
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

    console.log('Found sale:', sale);

    // Update payment dates
    const { payments } = req.body;
    if (payments && Array.isArray(payments)) {
        sale.payments = payments.map(payment => ({
            ...payment,
            dueDate: new Date(payment.dueDate)
        }));
        
        const updatedSale = await sale.save();
        console.log('Updated sale:', updatedSale);
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

    console.log('Found sale:', sale);

    const payment = sale.payments.id(req.params.paymentId);
    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    const { paidAmount, paidDate } = req.body;
    payment.paidAmount = paidAmount;
    payment.paidDate = paidDate;
    payment.isPaid = paidAmount >= payment.amount;

    console.log('Updated payment:', payment);

    // Check if all payments are completed
    const allPaymentsMade = sale.payments.every(p => p.isPaid);
    if (allPaymentsMade) {
        sale.status = 'completed';
        sale.completedAt = new Date();
    }

    console.log('Updated sale:', sale);

    const updatedSale = await sale.save();
    console.log('Saved sale:', updatedSale);
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

    console.log('Found sale:', sale);

    sale.status = 'cancelled';
    sale.cancelledAt = new Date();

    console.log('Updated sale:', sale);

    const updatedSale = await sale.save();
    console.log('Saved sale:', updatedSale);
    res.json(updatedSale);
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public
const getSales = asyncHandler(async (req, res) => {
    try {
        const { blockId, customerId, type, status } = req.query;
        
        const filter = {};
        if (blockId) filter.block = blockId;
        if (customerId) filter.customer = customerId;
        if (type) filter.type = type;
        if (status) filter.status = status;

        console.log('Getting sales with filter:', filter);

        const sales = await Sale.find(filter)
            .populate('block', 'unitNumber type projectId')
            .populate('customer', 'firstName lastName tcNo phone')
            .sort('-createdAt');

        console.log('Found sales:', sales);

        res.json(sales);
    } catch (error) {
        console.error('Error getting sales:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get sales by project ID
// @route   GET /api/sales/project/:projectId
// @access  Public
const getSalesByProject = async (req, res) => {
    try {
        // Önce projeye ait blokları bul
        const blocks = await Block.find({ projectId: req.params.projectId });
        const blockIds = blocks.map(block => block._id);

        // Bu bloklara ait satışları getir
        const sales = await Sale.find({ block: { $in: blockIds } })
            .populate('block', 'unitNumber type')
            .populate('customer', 'firstName lastName tcNo phone');

        // Her satış için ödeme durumunu güncelle
        for (let sale of sales) {
            sale.updatePaymentStatus();
            await sale.save();
        }

        res.json(sales);
    } catch (error) {
        console.error('Error getting sales by project:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export {
    createSale,
    getSaleById,
    updatePaymentPlan,
    recordPayment,
    cancelSale,
    getSales,
    getSalesByProject
};
