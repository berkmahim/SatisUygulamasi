import asyncHandler from 'express-async-handler';
import Reference from '../models/referenceModel.js';

// @desc    Get all references
// @route   GET /api/references
// @access  Private
const getReferences = asyncHandler(async (req, res) => {
    const references = await Reference.find({}).sort({ name: 1 });
    res.json(references);
});

// @desc    Create a new reference
// @route   POST /api/references
// @access  Private
const createReference = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
        res.status(400);
        throw new Error('Referans adı gereklidir');
    }

    // Check if reference already exists
    const existingReference = await Reference.findOne({ name: name.trim() });
    if (existingReference) {
        res.status(400);
        throw new Error('Bu referans zaten mevcut');
    }

    const reference = await Reference.create({
        name: name.trim(),
        description: description || ''
    });

    res.status(201).json(reference);
});

// @desc    Update a reference
// @route   PUT /api/references/:id
// @access  Private
const updateReference = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const reference = await Reference.findById(req.params.id);

    if (!reference) {
        res.status(404);
        throw new Error('Referans bulunamadı');
    }

    if (name && name.trim() !== reference.name) {
        // Check if new name already exists
        const existingReference = await Reference.findOne({ name: name.trim() });
        if (existingReference) {
            res.status(400);
            throw new Error('Bu referans adı zaten mevcut');
        }
    }

    reference.name = name?.trim() || reference.name;
    reference.description = description !== undefined ? description : reference.description;

    const updatedReference = await reference.save();
    res.json(updatedReference);
});

// @desc    Delete a reference
// @route   DELETE /api/references/:id
// @access  Private
const deleteReference = asyncHandler(async (req, res) => {
    const reference = await Reference.findById(req.params.id);

    if (!reference) {
        res.status(404);
        throw new Error('Referans bulunamadı');
    }

    await reference.deleteOne();
    res.json({ message: 'Referans silindi' });
});

export {
    getReferences,
    createReference,
    updateReference,
    deleteReference
};