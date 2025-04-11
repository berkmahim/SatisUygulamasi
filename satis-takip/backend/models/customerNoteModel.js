import mongoose from 'mongoose';

const customerNoteSchema = mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['meeting', 'call', 'email', 'other'],
        default: 'other'
    },
    isPrivate: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('CustomerNote', customerNoteSchema);
