import asyncHandler from 'express-async-handler';
import Block from '../models/blockModel.js';
import Project from '../models/projectModel.js';
import Sale from '../models/saleModel.js';

// @desc    Get blocks for a project
// @route   GET /api/blocks/:projectId
// @access  Private
const getBlocks = asyncHandler(async (req, res) => {
    const blocks = await Block.find({ projectId: req.params.projectId })
        .populate('owner', 'firstName lastName')
        .populate('reference', 'name');
    
    // Check for overdue payments for each block
    const blocksWithPaymentInfo = await Promise.all(
        blocks.map(async (block) => {
            const blockObj = block.toObject();
            
            if (block.owner) {
                let hasOverduePayment = false;
                
                // First, check for individual block sales
                const individualSale = await Sale.findOne({ blockId: block._id, isBulkSale: { $ne: true } })
                    .populate('customerId', 'firstName lastName');
                
                if (individualSale) {
                    hasOverduePayment = individualSale.payments.some(payment => 
                        payment.status === 'overdue'
                    );
                }
                
                // Then, check for bulk sales that include this block
                if (!hasOverduePayment) {
                    const bulkSale = await Sale.findOne({ 
                        'bulkSaleBlocks.blockId': block._id,
                        isBulkSale: true
                    }).populate('customerId', 'firstName lastName');
                    
                    if (bulkSale) {
                        hasOverduePayment = bulkSale.payments.some(payment => 
                            payment.status === 'overdue'
                        );
                    }
                }
                
                blockObj.hasOverduePayment = hasOverduePayment;
            }
            
            return blockObj;
        })
    );
    
    res.json(blocksWithPaymentInfo);
});

// @desc    Get block by ID
// @route   GET /api/blocks/detail/:id
// @access  Private
const getBlockById = asyncHandler(async (req, res) => {
    const block = await Block.findById(req.params.id)
        .populate('owner', 'firstName lastName')
        .populate('reference', 'name');
    
    if (block) {
        res.json(block);
    } else {
        res.status(404);
        throw new Error('Blok bulunamadı');
    }
});

// @desc    Create a block
// @route   POST /api/blocks/:projectId
// @access  Private
const createBlock = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        res.status(404);
        throw new Error('Proje bulunamadı');
    }

    const block = await Block.create({
        ...req.body,
        projectId: req.params.projectId
    });

    res.status(201).json(block);
});

// @desc    Update a block
// @route   PATCH /api/blocks/:id
// @access  Private
const updateBlock = asyncHandler(async (req, res) => {
    try {
        const block = await Block.findById(req.params.id);

        if (!block) {
            res.status(404);
            throw new Error('Block not found');
        }

        // Güncelleme verilerini hazırla
        const updateData = {
            ...block.toObject(),
            // Boyut ve konum güncellemeleri, null veya undefined değilse kullan
            ...(req.body.dimensions && { dimensions: req.body.dimensions }),
            ...(req.body.position && { position: req.body.position }),
            ...(req.body.unitNumber !== undefined && { unitNumber: req.body.unitNumber }),
            // Owner field'ı manuel string girişlerde güncelle, formatlanmış customer names'leri ignore et
            ...(req.body.owner && typeof req.body.owner === 'string' && !req.body.owner.includes(' ') && { owner: req.body.owner }),
            ...('reference' in req.body && { reference: req.body.reference || null }),
            ...(req.body.squareMeters !== undefined && { squareMeters: req.body.squareMeters }),
            ...(req.body.roomCount !== undefined && { roomCount: req.body.roomCount }),
            ...(req.body.type && { type: req.body.type }),
            ...(req.body.iskanPaymentDone !== undefined && { iskanPaymentDone: req.body.iskanPaymentDone }),
            // Temel alanları koru
            projectId: block.projectId
        };

        // type alanının geçerli olduğundan emin ol
        if (updateData.type && !['store', 'apartment'].includes(updateData.type)) {
            res.status(400);
            throw new Error('Invalid block type. Must be either "store" or "apartment"');
        }

        const updatedBlock = await Block.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('owner', 'firstName lastName')
         .populate('reference', 'name');

        if (!updatedBlock) {
            res.status(500);
            throw new Error('Block update failed');
        }

        res.json(updatedBlock);
    } catch (error) {
        console.error('Blok güncelleme hatası:', error);
        res.status(error.status || 500);
        throw error;
    }
});

// @desc    Delete a block
// @route   DELETE /api/blocks/:id
// @access  Private
const deleteBlock = asyncHandler(async (req, res) => {
    const block = await Block.findById(req.params.id);

    if (!block) {
        res.status(404);
        throw new Error('Block not found');
    }

    await block.deleteOne();
    res.json({ message: 'Blok silindi' });
});

export {
    getBlocks,
    getBlockById,
    createBlock,
    updateBlock,
    deleteBlock
};
