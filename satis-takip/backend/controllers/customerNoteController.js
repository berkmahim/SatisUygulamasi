import asyncHandler from 'express-async-handler';
import CustomerNote from '../models/customerNoteModel.js';
import Customer from '../models/customerModel.js';

// @desc    Get notes for a customer
// @route   GET /api/customer-notes/:customerId
// @access  Private
const getCustomerNotes = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    
    // Müşterinin var olduğunu kontrol et
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }
    
    // Özel notları sadece oluşturan kullanıcı görebilir
    const notes = await CustomerNote.find({
        customerId,
        $or: [
            { isPrivate: false },
            { isPrivate: true, userId: req.user._id }
        ]
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
    
    res.json(notes);
});

// @desc    Create a new customer note
// @route   POST /api/customer-notes
// @access  Private
const createCustomerNote = asyncHandler(async (req, res) => {
    const { customerId, title, content, type, isPrivate } = req.body;
    
    // Müşterinin var olduğunu kontrol et
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
        res.status(404);
        throw new Error('Müşteri bulunamadı');
    }
    
    const note = await CustomerNote.create({
        customerId,
        userId: req.user._id,
        title,
        content,
        type: type || 'other',
        isPrivate: isPrivate || false
    });
    
    // Müşterinin son iletişim tarihini güncelle
    await Customer.findByIdAndUpdate(customerId, {
        lastContactDate: new Date()
    });
    
    if (note) {
        res.status(201).json(note);
    } else {
        res.status(400);
        throw new Error('Geçersiz not bilgileri');
    }
});

// @desc    Update a customer note
// @route   PUT /api/customer-notes/:id
// @access  Private
const updateCustomerNote = asyncHandler(async (req, res) => {
    const note = await CustomerNote.findById(req.params.id);
    
    if (!note) {
        res.status(404);
        throw new Error('Not bulunamadı');
    }
    
    // Notu sadece oluşturan kişi güncelleyebilir
    if (note.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
    }
    
    const { title, content, type, isPrivate } = req.body;
    
    note.title = title || note.title;
    note.content = content || note.content;
    note.type = type || note.type;
    note.isPrivate = isPrivate !== undefined ? isPrivate : note.isPrivate;
    
    const updatedNote = await note.save();
    res.json(updatedNote);
});

// @desc    Delete a customer note
// @route   DELETE /api/customer-notes/:id
// @access  Private
const deleteCustomerNote = asyncHandler(async (req, res) => {
    const note = await CustomerNote.findById(req.params.id);
    
    if (!note) {
        res.status(404);
        throw new Error('Not bulunamadı');
    }
    
    // Notu sadece oluşturan kişi silebilir
    if (note.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bu işlem için yetkiniz bulunmamaktadır');
    }
    
    await CustomerNote.deleteOne({ _id: note._id });
    res.json({ message: 'Not başarıyla silindi' });
});

export {
    getCustomerNotes,
    createCustomerNote,
    updateCustomerNote,
    deleteCustomerNote
};
