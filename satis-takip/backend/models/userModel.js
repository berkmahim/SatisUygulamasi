import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const permissionSchema = new mongoose.Schema({
    projectManagement: { type: Boolean, default: false },
    salesManagement: { type: Boolean, default: false },
    customerManagement: { type: Boolean, default: false },
    paymentManagement: { type: Boolean, default: false },
    reportManagement: { type: Boolean, default: false },
    userManagement: { type: Boolean, default: false },
    activityLogManagement: { type: Boolean, default: false }, // İşlem loglarını görme izni
    paymentOverdueNotification: { type: Boolean, default: false } // Yeni eklenen bildirim izni
});

const notificationPreferencesSchema = new mongoose.Schema({
    email: {
        paymentOverdue: { type: Boolean, default: true },
        newCustomer: { type: Boolean, default: true },
        saleCompleted: { type: Boolean, default: true }
    },
    inApp: {
        paymentOverdue: { type: Boolean, default: true },
        newCustomer: { type: Boolean, default: true },
        saleCompleted: { type: Boolean, default: true }
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    permissions: {
        type: permissionSchema,
        default: () => ({})
    },
    notificationPreferences: {
        type: notificationPreferencesSchema,
        default: () => ({})
    },
    isActive: {
        type: Boolean,
        default: true
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    backupCodes: [{
        code: String,
        used: {
            type: Boolean,
            default: false
        }
    }],
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Şifre karşılaştırma metodu
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Kaydetmeden önce şifreyi hashleme
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
