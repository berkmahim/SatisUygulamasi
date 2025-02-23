import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Customer from '../models/customerModel.js';

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
    try {
        const {
            blockId,
            customerId,
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate,
            payments // Özel vade tarihleri için eklendi
        } = req.body;

        // Blok'u bul ve kontrol et
        const block = await Block.findById(blockId);
        if (!block) {
            return res.status(404).json({ message: 'Blok bulunamadı' });
        }
        // Müşteriyi kontrol et
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Blok daha önce satılmış mı kontrol et
        if (block.owner) {
            return res.status(400).json({ message: 'Bu blok zaten satılmış' });
        }

        // Ödemeleri kontrol et ve düzenle
        const formattedPayments = payments ? payments.map(payment => ({
            amount: parseFloat(payment.amount),
            dueDate: new Date(payment.dueDate),
            description: payment.description,
            installmentNumber: parseInt(payment.description.split('/')[0].replace('Taksit ', '')),
            status: 'pending'
        })) : [];

        // Yeni satış oluştur
        const sale = new Sale({
            blockId,
            customerId,
            projectId: block.projectId,
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate: new Date(firstPaymentDate),
            payments: formattedPayments
        });

        // Özel vade tarihleri varsa onları kullan, yoksa otomatik oluştur
        if (payments && payments.length > 0) {
            sale.payments = payments.map((payment, index) => ({
                amount: payment.amount,
                dueDate: new Date(payment.dueDate),
                description: payment.description,
                installmentNumber: index + 1,
                status: 'pending'
            }));
        } else {
            sale.generatePaymentSchedule();
        }

        // Satışı kaydet
        const savedSale = await sale.save();
        // Blok'u güncelle
        block.owner = customerId;
        block.status = type === 'sale' ? 'sold' : 'reserved';
        await block.save();

        const populatedSale = await Sale.findById(savedSale._id)
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone');

        res.status(201).json(populatedSale);
    } catch (error) {
        console.warn('Error creating sale:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = asyncHandler(async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone');

        if (!sale) {
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        res.json(sale);
    } catch (error) {
        console.error('Error getting sale:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @desc    Update sale payment plan
// @route   PUT /api/sales/:id/payment-plan
// @access  Private
const updatePaymentPlan = asyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id)
        .populate('blockId', 'unitNumber type')
        .populate('customerId', 'firstName lastName tcNo phone');

    if (!sale) {
        res.status(404);
        throw new Error('Satış bulunamadı');
    }

    console.log('Found sale:', sale);

    // Ödeme tarihlerini güncelle
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

// @desc    Cancel a sale and process refund
// @route   POST /api/sales/:id/cancel
// @access  Public
const cancelSaleAndRefund = asyncHandler(async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            res.status(404);
            throw new Error('Satış bulunamadı');
        }

        const { refundAmount, refundReason, refundDate } = req.body;

        // Toplam ödenen tutarı kontrol et
        const totalPaid = sale.payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
        if (refundAmount > totalPaid) {
            res.status(400);
            throw new Error('İade tutarı, toplam ödenen tutardan büyük olamaz');
        }

        // Satışı iptal et
        sale.status = 'cancelled';
        sale.cancellationDetails = {
            cancelledAt: new Date(),
            reason: refundReason,
            refundAmount: refundAmount,
            refundDate: refundDate || new Date()
        };

        // Bloğu tekrar satışa çıkar
        const block = await Block.findById(sale.block);
        if (block) {
            block.status = 'available';
            await block.save();
        }

        await sale.save();

        res.json({
            message: 'Satış başarıyla iptal edildi ve iade işlemi kaydedildi',
            sale
        });
    } catch (error) {
        console.error('Error cancelling sale:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
    try {
        const { blockId, customerId, type, status, projectId } = req.query;
        
        const filter = {};
        if (blockId) filter.blockId = blockId;
        if (customerId) filter.customerId = customerId;
        if (projectId) filter.projectId = projectId;
        if (type) filter.type = type;
        if (status) filter.status = status;

        const sales = await Sale.find(filter)
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone')
            .sort('-createdAt');

        res.json(sales);
    } catch (error) {
        console.error('Error getting sales:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @desc    Get cancelled sales
// @route   GET /api/sales/cancelled
// @access  Public
const getCancelledSales = asyncHandler(async (req, res) => {
    try {
        const cancelledSales = await Sale.find({ status: 'cancelled' })
            .populate('block', 'blockNumber projectId')
            .populate('customer', 'firstName lastName');

        res.json(cancelledSales);
    } catch (error) {
        console.error('Error getting cancelled sales:', error);
        res.status(500).json({ message: 'Cancelled sales could not be retrieved' });
    }
});

// @desc    Get sales by project ID
// @route   GET /api/sales/project/:projectId
// @access  Private
const getSalesByProject = asyncHandler(async (req, res) => {
    try {
        const sales = await Sale.find({ projectId: req.params.projectId })
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone')
            .sort('-createdAt');

        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @desc    Get sales by customer ID
// @route   GET /api/sales/customer/:customerId
// @access  Private
const getSalesByCustomerId = asyncHandler(async (req, res) => {
    try {
        const sales = await Sale.find({ customerId: req.params.customerId })
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone');

        res.json(sales);
    } catch (error) {
        console.error('Error getting customer sales:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @desc    Get sales by block ID
// @route   GET /api/sales/block/:blockId
// @access  Private
const getSalesByBlockId = asyncHandler(async (req, res) => {
    try {
        const sales = await Sale.find({ blockId: req.params.blockId })
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone');

        res.json(sales);
    } catch (error) {
        console.error('Error getting block sales:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

export {
    createSale,
    getSaleById,
    updatePaymentPlan,
    recordPayment,
    cancelSale,
    getSales,
    getSalesByProject,
    cancelSaleAndRefund,
    getCancelledSales,
    getSalesByCustomerId,
    getSalesByBlockId
};
