import asyncHandler from 'express-async-handler';
import Block from '../models/blockModel.js';
import Project from '../models/projectModel.js';

// @desc    Get blocks for a project
// @route   GET /api/blocks/:projectId
// @access  Private
const getBlocks = asyncHandler(async (req, res) => {
    const blocks = await Block.find({ projectId: req.params.projectId })
        .populate('owner', 'firstName lastName');
    res.json(blocks);
});

// @desc    Get block by ID
// @route   GET /api/blocks/detail/:id
// @access  Private
const getBlockById = asyncHandler(async (req, res) => {
    const block = await Block.findById(req.params.id)
        .populate('owner', 'firstName lastName');
    
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
    const block = await Block.findById(req.params.id);

    if (!block) {
        res.status(404);
        throw new Error('Block not found');
    }

    const updatedBlock = await Block.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    ).populate('owner', 'firstName lastName');

    res.json(updatedBlock);
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
