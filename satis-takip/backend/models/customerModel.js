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
    }
}, {
    timestamps: true
});

export default mongoose.model('Customer', customerSchema);
