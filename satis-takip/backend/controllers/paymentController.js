import Payment from '../models/paymentModel.js';
import Sale from '../models/saleModel.js';
import Customer from '../models/customerModel.js';
import Block from '../models/blockModel.js';
import { createLog } from './logController.js';

// @desc    Record a payment for a sale
// @route   POST /api/payments/:saleId
// @access  Private
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
        let updatedSale;
        
        // Bulk sale için farklı populate yap
        if (sale.isBulkSale) {
            updatedSale = await Sale.findById(sale._id)
                .populate('customerId', 'firstName lastName tcNo phone')
                .populate('blockIds', 'unitNumber type')  // Populate all block IDs for bulk sales
                .populate('bulkSaleBlocks.blockId', 'unitNumber type');
        } else {
            updatedSale = await Sale.findById(sale._id)
                .populate('blockId', 'unitNumber type')
                .populate('customerId', 'firstName lastName tcNo phone');
        }

        // Log kaydı oluştur
        const customer = await Customer.findById(updatedSale.customerId);
        let logDescription = '';
        
        if (updatedSale.isBulkSale) {
            // Bulk sale için log mesajı - unit numbers dahil
            const unitNumbers = updatedSale.blockIds?.map(block => block.unitNumber).filter(Boolean).join(', ') || 'N/A';
            logDescription = `${customer.firstName} ${customer.lastName} müşterisine ait toplu satış (Birimler: ${unitNumbers}) için ${payment.amount.toLocaleString('tr-TR')} TL tutarında ödeme kaydedildi. Bulk ID: ${updatedSale.bulkSaleId?.slice(-8) || 'N/A'}`;
        } else {
            // Individual sale için log mesajı
            const block = await Block.findById(updatedSale.blockId);
            if (block) {
                logDescription = `${customer.firstName} ${customer.lastName} müşterisine ait ${block.unitNumber} ${block.type} için ${payment.amount.toLocaleString('tr-TR')} TL tutarında ödeme kaydedildi.`;
            } else {
                logDescription = `${customer.firstName} ${customer.lastName} müşterisine ait birim için ${payment.amount.toLocaleString('tr-TR')} TL tutarında ödeme kaydedildi.`;
            }
        }
        
        await createLog({
            type: 'payment',
            action: 'create',
            description: logDescription,
            entityId: payment._id.toString(),
            userId: req.user._id
        }, req);

        res.json(updatedSale);
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get payment details for a sale
// @route   GET /api/payments/:saleId
// @access  Private
const getPaymentDetails = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId)
            .populate('customerId', 'firstName lastName tcNo phone');
            
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        // Populate block information based on sale type
        if (sale.isBulkSale) {
            // Bulk sale için tüm blockIds'leri populate et
            await sale.populate('blockIds', 'unitNumber type');
            await sale.populate('bulkSaleBlocks.blockId', 'unitNumber type');
        } else if (sale.blockId) {
            // Individual sale için blockId populate et
            await sale.populate('blockId', 'unitNumber type');
        }

        // Ödemeleri sırala
        sale.payments.sort((a, b) => a.installmentNumber - b.installmentNumber);

        res.json({
            totalAmount: sale.totalAmount,
            totalPaidAmount: sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
            remainingAmount: sale.totalAmount - sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
            paymentStatus: sale.paymentStatus,
            // Include block information for both individual and bulk sales
            isBulkSale: sale.isBulkSale,
            bulkSaleId: sale.bulkSaleId,
            blockIds: sale.blockIds, // All blocks for bulk sales
            blockId: sale.blockId,   // Single block for individual sales
            bulkSaleBlocks: sale.bulkSaleBlocks, // Detailed block info with prices for bulk sales
            // Generate unit numbers display
            unitNumbers: sale.isBulkSale 
                ? sale.blockIds?.map(block => block.unitNumber).filter(Boolean).join(', ') || 'N/A'
                : sale.blockId?.unitNumber || 'N/A',
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
                notes: payment.notes,
                isAdvancePayment: payment.installmentNumber === 1
            }))
        });
    } catch (error) {
        console.error('Error getting payment details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update payment due date
// @route   PUT /api/payments/:saleId/due-date
// @access  Private
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
// @access  Private
const getOverduePayments = async (req, res) => {
    try {
        const sales = await Sale.find({ paymentStatus: 'overdue' })
            .populate('customerId', 'firstName lastName tcNo phone');
            
        // Populate block information for all sales
        for (const sale of sales) {
            if (sale.isBulkSale) {
                // Bulk sale için tüm blockIds'leri populate et
                await sale.populate('blockIds', 'unitNumber type');
                await sale.populate('bulkSaleBlocks.blockId', 'unitNumber type');
            } else if (sale.blockId) {
                // Individual sale için blockId populate et
                await sale.populate('blockId', 'unitNumber type');
            }
        }

        const overduePayments = sales.map(sale => ({
            saleId: sale._id,
            block: sale.isBulkSale ? null : sale.blockId, // Single block for individual sales
            blocks: sale.isBulkSale ? sale.blockIds : null, // All blocks for bulk sales
            customer: sale.customerId,
            totalAmount: sale.totalAmount,
            remainingAmount: sale.remainingAmount,
            nextPaymentDate: sale.nextPaymentDate,
            nextPaymentAmount: sale.nextPaymentAmount,
            isBulkSale: sale.isBulkSale,
            bulkSaleId: sale.bulkSaleId,
            bulkSaleBlocks: sale.bulkSaleBlocks,
            // Generate unit numbers display
            unitNumbers: sale.isBulkSale 
                ? sale.blockIds?.map(block => block.unitNumber).filter(Boolean).join(', ') || 'N/A'
                : sale.blockId?.unitNumber || 'N/A',
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

// @desc    Record bulk payments for a sale
// @route   POST /api/payments/:saleId/bulk
// @access  Private
const recordBulkPayments = async (req, res) => {
    try {
        const { saleId } = req.params;
        const payments = req.body;

        const sale = await Sale.findById(saleId)
            .populate('payments')
            .populate('customerId')
            .populate('blockId');

        if (!sale) {
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        // Her bir ödeme için işlem yap
        for (const payment of payments) {
            const installment = sale.payments.find(p => p._id.toString() === payment.installmentId);
            
            if (!installment) {
                return res.status(400).json({ message: 'Geçersiz taksit' });
            }

            if (payment.paidAmount > (installment.amount - (installment.paidAmount || 0))) {
                return res.status(400).json({ message: 'Ödeme tutarı kalan tutardan büyük olamaz' });
            }

            // Ödeme kaydını güncelle
            installment.paidAmount = (installment.paidAmount || 0) + payment.paidAmount;
            installment.paidDate = payment.paidDate;
            installment.paymentMethod = payment.paymentMethod;
            installment.status = installment.paidAmount >= installment.amount ? 'paid' : 'partial';
            
            await installment.save();
        }

        // Satışın toplam ödeme durumunu güncelle
        const totalAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        
        sale.paymentStatus = totalPaid >= totalAmount ? 'paid' : 'partial';
        await sale.save();

        res.json({ message: 'Ödemeler başarıyla kaydedildi' });
    } catch (error) {
        console.error('Toplu ödeme hatası:', error);
        res.status(500).json({ message: 'Ödemeler kaydedilirken bir hata oluştu' });
    }
};

// @desc    Update payment plan
// @route   PUT /api/payments/:saleId/plan
// @access  Private
const updatePaymentPlan = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.saleId);
        if (!sale) {
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        const {
            totalAmount,
            downPayment,
            installmentCount,
            firstPaymentDate,
            paymentPlan
        } = req.body;

        // Sadece ödenmemiş taksitleri güncelle
        const unpaidPayments = sale.payments.filter(p => p.status !== 'paid');
        if (unpaidPayments.length === 0) {
            return res.status(400).json({ message: 'Tüm ödemeler yapılmış, plan güncellenemez' });
        }

        // Ödeme planı tipini güncelle
        if (paymentPlan) {
            sale.paymentPlan = paymentPlan;
        }

        // Toplam tutarı güncelle
        if (totalAmount) {
            const paidAmount = sale.payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
            if (totalAmount < paidAmount) {
                return res.status(400).json({ message: 'Yeni toplam tutar, ödenmiş tutardan küçük olamaz' });
            }
            sale.totalAmount = totalAmount;
        }

        // Peşinat ve taksit sayısını güncelle
        if (downPayment !== undefined) sale.downPayment = downPayment;
        if (installmentCount) sale.installmentCount = installmentCount;
        if (firstPaymentDate) sale.firstPaymentDate = firstPaymentDate;

        // Ödeme planını yeniden oluştur
        sale.generatePaymentSchedule();
        await sale.save();

        res.json({ message: 'Ödeme planı başarıyla güncellendi', sale });
    } catch (error) {
        console.error('Error updating payment plan:', error);
        res.status(500).json({ message: 'Ödeme planı güncellenirken bir hata oluştu' });
    }
};

export {
    recordPayment,
    getPaymentDetails,
    updatePaymentDueDate,
    getOverduePayments,
    recordBulkPayments,
    updatePaymentPlan
};
