import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'İsim alanı zorunludur']
    },
    lastName: {
        type: String,
        required: [true, 'Soyisim alanı zorunludur']
    },
    tcNo: {
        type: String,
        required: [true, 'TC Kimlik No zorunludur'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email alanı zorunludur'],
        unique: true
    },
    phone: {
        type: String,
        required: [true, 'Telefon alanı zorunludur']
    },
    // CRM için eklenen alanlar
    secondaryPhone: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    occupation: {
        type: String
    },
    customerSource: {
        type: String,
        enum: ['referral', 'advertisement', 'website', 'social_media', 'direct', 'other'],
        default: 'other'
    },
    customerStatus: {
        type: String,
        enum: ['lead', 'prospect', 'active', 'inactive'],
        default: 'prospect'
    },
    tags: [{
        type: String
    }],
    birthDate: {
        type: Date
    },
    lastContactDate: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model('Customer', customerSchema);
