import mongoose from 'mongoose';

const projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Proje adı zorunludur']
    },
    location: {
        type: String,
        required: [true, 'Proje konumu zorunludur']
    },
    description: {
        type: String,
        required: [true, 'Proje açıklaması zorunludur']
    },
    backgroundImage: {
        type: String,
        default: ''
    },
    blocks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block'
    }]
}, {
    timestamps: true
});

export default mongoose.model('Project', projectSchema);
