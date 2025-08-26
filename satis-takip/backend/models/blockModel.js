import mongoose from 'mongoose';

const blockSchema = mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Project'
    },
    position: {
        type: [Number],
        required: true
    },
    dimensions: {
        width: { type: Number, default: 1 },
        height: { type: Number, default: 1 },
        depth: { type: Number, default: 1 }
    },
    type: {
        type: String,
        required: true,
        enum: ['store', 'apartment']
    },
    unitNumber: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    reference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reference'
    },
    squareMeters: Number,
    roomCount: String,
    iskanPaymentDone: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Block', blockSchema);
