import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Block from '../models/blockModel.js';
import Customer from '../models/customerModel.js';
import User from '../models/userModel.js'; 
import { sendSaleEmail } from '../config/mailer.js';
import { createLog } from './logController.js';

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
        const block = await Block.findById(blockId).populate('projectId', 'name');
        if (!block) {
            return res.status(404).json({ message: 'Blok bulunamadı' });
        }
        // Müşteriyi kontrol et
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Blok'un durumunu kontrol et
        if (block.status === 'sold') {
            return res.status(400).json({ message: 'Bu birim zaten satılmış' });
        }

        // Vade tarihlerini düzenle
        let paymentDates = [];
        if (payments && Array.isArray(payments)) {
            paymentDates = payments.map((p, index) => ({
                ...p,
                dueDate: new Date(p.dueDate),
                installmentNumber: index + 1, // Taksit numarası ekliyorum
                status: p.paidAmount && p.paidAmount >= p.amount ? 'paid' : 'pending'
            }));
        }

        // Proje adını blok nesnesine ekle
        block.projectName = block.projectId?.name || 'Belirtilmemiş';

        // Yeni satış kaydı oluştur
        const sale = new Sale({
            blockId,
            customerId,
            projectId: block.projectId, // Block'un projectId'sini ekliyorum
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate: new Date(firstPaymentDate), // firstPaymentDate ekliyorum
            payments: paymentDates.length > 0 ? paymentDates : [],
            createdBy: req.user._id
        });

        await sale.save();

        // Blok'u "satıldı" olarak işaretle
        block.status = 'sold';
        block.owner = customerId;
        block.saleId = sale._id;
        await block.save();

        // E-posta bildirimi için admin kullanıcılarını bul
        const adminUsers = await User.find({ role: 'admin' });
        
        // Satış e-postası gönder
        if (adminUsers && adminUsers.length > 0) {
            await sendSaleEmail(sale, block, customer, req.user, adminUsers);
        }

        // Log kaydı oluştur
        await createLog({
            type: 'sale',
            action: 'create',
            description: `${customer.firstName} ${customer.lastName} müşterisine ${block.projectName || 'Belirtilmemiş'} projesinden ${block.unitNumber} nolu birim ${totalAmount.toLocaleString('tr-TR')} TL tutarla satıldı.`,
            entityId: sale._id.toString(),
            userId: req.user._id
        }, req);

        return res.status(201).json(sale);
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = asyncHandler(async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('customerId', 'firstName lastName tcNo phone');

        if (!sale) {
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        // Populate different fields based on sale type
        if (sale.isBulkSale) {
            // For bulk sales, populate all block IDs
            await sale.populate('blockIds', 'unitNumber type');
            await sale.populate('bulkSaleBlocks.blockId', 'unitNumber type');
            await sale.populate({
                path: 'bulkSaleBlocks.blockId',
                populate: {
                    path: 'reference',
                    select: 'name'
                }
            });
        } else {
            // For individual sales, populate the single block
            await sale.populate({
                path: 'blockId',
                select: 'unitNumber type',
                populate: {
                    path: 'reference',
                    select: 'name'
                }
            });
        }

        // Add unitNumbers field for consistent display
        const response = {
            ...sale.toObject(),
            unitNumbers: sale.isBulkSale 
                ? sale.blockIds?.map(block => block.unitNumber).filter(Boolean).join(', ') || 'N/A'
                : sale.blockId?.unitNumber || 'N/A'
        };

        res.json(response);
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

// @desc    Cancel sale and handle refund
// @route   POST /api/sales/:id/cancel
// @access  Private/Admin
const cancelSaleAndRefund = asyncHandler(async (req, res) => {
    try {
        const { hasRefund, refundAmount, refundDate, refundReason } = req.body;

        // Satışı bul
        const sale = await Sale.findById(req.params.id)
            .populate({
                path: 'blockId',
                populate: {
                    path: 'projectId',
                    select: 'name'
                }
            })
            .populate('customerId');

        if (!sale) {
            res.status(404);
            throw new Error('Satış bulunamadı');
        }

        // Satışın durumunu kontrol et
        if (sale.status === 'cancelled') {
            return res.status(400).json({ message: 'Bu satış zaten iptal edilmiş' });
        }

        // Blok bilgilerini al
        const block = sale.blockId;
        const customer = sale.customerId;

        // Proje adını blok nesnesine ekle
        block.projectName = block.projectId?.name || 'Belirtilmemiş';

        // Toplam ödenen miktarı hesapla (bu değer daha önce hesaplanmışsa tekrar hesaplamaya gerek yok)
        let totalPaid = 0;
        if (!hasRefund) {
            sale.payments.forEach(payment => {
                if (payment.paidAmount) {
                    totalPaid += payment.paidAmount;
                }
            });
        }

        // İade işlemi
        if (hasRefund && refundAmount > 0) {
            console.log(`${refundAmount} TL iade işlemi yapılıyor...`);
            // İade işlemi burada gerçekleşir
            // Ödeme sistemi entegrasyonu burada yapılabilir
        }

        // Birim durumunu "available" olarak güncelle
        await Block.findByIdAndUpdate(sale.blockId, { status: 'available', owner: null, saleId: null });

        // Satış durumunu "cancelled" olarak güncelle
        sale.status = 'cancelled';
        
        // İptal detaylarını ayarla
        sale.cancellationDetails = {
            cancelledAt: new Date(),
            reason: refundReason || 'İptal nedeni belirtilmedi',
            refundAmount: hasRefund ? refundAmount : 0,
            refundDate: hasRefund ? new Date(refundDate) : null,
            hasRefund: hasRefund
        };

        // Kaydı güncelle
        await sale.save();

        // E-posta bildirimi için admin kullanıcılarını bul
        const adminUsers = await User.find({ role: 'admin' });
        
        // İptal e-postası gönder
        if (adminUsers && adminUsers.length > 0) {
            await sendSaleEmail(sale, block, customer, req.user, adminUsers, true); // true -> iptal için
        }

        // Log kaydı oluştur
        await createLog({
            type: 'sale-cancel',
            action: 'delete',
            description: `${customer.firstName} ${customer.lastName} müşterisine satılan ${block.projectName || 'Belirtilmemiş'} projesinden ${block.unitNumber} nolu birimin satışı iptal edildi. ${hasRefund ? `${refundAmount.toLocaleString('tr-TR')} TL iade yapıldı.` : 'İade yapılmadı.'}`,
            entityId: sale._id.toString(),
            userId: req.user._id
        }, req);

        res.status(200).json({
            message: 'Satış başarıyla iptal edildi',
            sale: {
                _id: sale._id,
                status: sale.status,
                cancellationDetails: sale.cancellationDetails
            }
        });

    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'Satış iptal işlemi sırasında bir hata oluştu');
    }
});

// @desc    Cancel sale (LEGACY - Use cancelSaleAndRefund instead)
// @route   DELETE /api/sales/:id
// @access  Public
const cancelSaleLegacy = asyncHandler(async (req, res) => {
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
        const { projectId } = req.query;
        const filter = { status: 'cancelled' };
        
        if (projectId) {
            filter.projectId = projectId;
        }
        
        const cancelledSales = await Sale.find(filter)
            .populate('blockId', 'unitNumber type projectId')
            .populate('customerId', 'firstName lastName tcNo phone')
            .sort('-cancellationDetails.cancelledAt');

        res.json(cancelledSales);
    } catch (error) {
        console.error('Error getting cancelled sales:', error);
        res.status(500).json({ message: 'İptal edilmiş satışlar getirilemedi' });
    }
});

// @desc    Get sales by project ID
// @route   GET /api/sales/project/:projectId
// @access  Private
const getSalesByProject = asyncHandler(async (req, res) => {
    try {
        const { status } = req.query;
        
        const filter = { projectId: req.params.projectId };
        if (status) {
            filter.status = status;
        }
        
        const sales = await Sale.find(filter)
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone')
            .sort('-createdAt');

        res.json(sales);
    } catch (error) {
        console.error('Error getting sales by project:', error);
        res.status(500).json({ message: 'Proje satışları getirilemedi' });
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
        const sales = await Sale.find({ 
            blockId: req.params.blockId,
            status: { $ne: 'cancelled' } // Only active sales
        })
            .populate('blockId', 'unitNumber type')
            .populate('customerId', 'firstName lastName tcNo phone email');

        res.json(sales);
    } catch (error) {
        console.error('Error getting block sales:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// @desc    Update refund status
// @route   PUT /api/sales/:id/update-refund
// @access  Private/Admin
const updateRefundStatus = asyncHandler(async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);

        if (!sale) {
            res.status(404);
            throw new Error('Satış bulunamadı');
        }

        // Satışın iptal edilmiş olduğunu kontrol et
        if (sale.status !== 'cancelled') {
            res.status(400);
            throw new Error('Sadece iptal edilmiş satışlar için iade durumu güncellenebilir');
        }

        const { hasRefund, refundDate, refundAmount } = req.body;

        // İade durumunu güncelle
        if (sale.cancellationDetails) {
            sale.cancellationDetails.hasRefund = hasRefund || false;
            
            if (refundDate) {
                sale.cancellationDetails.refundDate = new Date(refundDate);
            }
            
            if (refundAmount !== undefined) {
                sale.cancellationDetails.refundAmount = refundAmount;
            }
        } else {
            sale.cancellationDetails = {
                cancelledAt: sale.updatedAt,
                hasRefund: hasRefund || false,
                refundDate: refundDate ? new Date(refundDate) : null,
                refundAmount: refundAmount || 0,
                reason: 'İade durumu güncellendi'
            };
        }

        // Kaydı güncelle
        await sale.save();

        res.status(200).json({
            message: 'İade durumu başarıyla güncellendi',
            sale: {
                _id: sale._id,
                status: sale.status,
                cancellationDetails: sale.cancellationDetails
            }
        });

    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode);
        throw new Error(error.message || 'İade durumu güncellenirken bir hata oluştu');
    }
});

// @desc    Create a unified bulk sale with multiple blocks
// @route   POST /api/sales/bulk
// @access  Private
const createBulkSale = asyncHandler(async (req, res) => {
    try {
        const {
            isBulkSale,
            bulkSaleId,
            projectId,
            customerId,
            type,
            paymentPlan,
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate,
            payments,
            bulkSaleBlocks
        } = req.body;

        // Validate bulk sale data
        if (!isBulkSale || !bulkSaleBlocks || !Array.isArray(bulkSaleBlocks) || bulkSaleBlocks.length === 0) {
            return res.status(400).json({ message: 'Bulk sale data is required' });
        }

        // Validate customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Validate all blocks and check availability
        for (const blockInfo of bulkSaleBlocks) {
            const block = await Block.findById(blockInfo.blockId);
            if (!block) {
                return res.status(404).json({ message: `Blok bulunamadı: ${blockInfo.blockId}` });
            }
            if (block.status === 'sold') {
                return res.status(400).json({ message: `Bu birim zaten satılmış: ${block.unitNumber || blockInfo.blockId}` });
            }
        }

        // Vade tarihlerini düzenle
        let paymentDates = [];
        if (payments && Array.isArray(payments)) {
            paymentDates = payments.map((p, index) => ({
                ...p,
                dueDate: new Date(p.dueDate),
                installmentNumber: index + 1,
                status: p.paidAmount && p.paidAmount >= p.amount ? 'paid' : 'pending'
            }));
        }

        // Yeni bulk satış kaydı oluştur
        const sale = new Sale({
            customerId,
            projectId,
            type: type || 'sale',
            paymentPlan,
            totalAmount,
            downPayment: downPayment || 0,
            installmentCount,
            firstPaymentDate: new Date(firstPaymentDate),
            payments: paymentDates.length > 0 ? paymentDates : [],
            createdBy: req.user._id,
            // Bulk sale specific fields
            isBulkSale: true,
            bulkSaleId,
            bulkSaleBlocks,
            // Store all block IDs for easier querying and display
            blockIds: bulkSaleBlocks.map(block => block.blockId)
        });

        await sale.save();

        // Tüm blokları "satıldı" olarak işaretle
        for (const blockInfo of bulkSaleBlocks) {
            await Block.findByIdAndUpdate(blockInfo.blockId, {
                status: 'sold',
                owner: customerId,
                saleId: sale._id
            });
        }

        // E-posta bildirimi için admin kullanıcılarını bul
        const adminUsers = await User.find({ role: 'admin' });
        
        // Bulk satış için e-posta gönder
        if (adminUsers && adminUsers.length > 0) {
            try {
                // İlk bloğu temsili olarak kullan
                const firstBlock = await Block.findById(bulkSaleBlocks[0].blockId).populate('projectId', 'name');
                if (firstBlock) {
                    await sendSaleEmail(sale, firstBlock, customer, req.user, adminUsers);
                }
            } catch (emailError) {
                console.warn('Toplu satış e-posta gönderimi hatası:', emailError);
            }
        }

        // Log kaydı oluştur
        await createLog({
            type: 'sale',
            action: 'create',
            description: `${customer.firstName} ${customer.lastName} müşterisine toplu satış yapıldı. ${bulkSaleBlocks.length} birim, toplam ${totalAmount.toLocaleString('tr-TR')} TL tutarla satıldı. Bulk ID: ${bulkSaleId}`,
            entityId: sale._id.toString(),
            userId: req.user._id
        }, req);

        return res.status(201).json({
            message: 'Toplu satış başarıyla oluşturuldu',
            sale,
            bulkSaleId
        });

    } catch (error) {
        console.error('Error creating bulk sales:', error);
        res.status(400).json({ message: error.message });
    }
});

export {
    createSale,
    createBulkSale,
    getSaleById,
    updatePaymentPlan,
    getSales,
    getSalesByProject,
    cancelSale,
    cancelSaleAndRefund,
    getCancelledSales,
    getSalesByCustomerId,
    getSalesByBlockId,
    updateRefundStatus
};
