import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const createAdminUser = async () => {
    try {
        await connectDB();

        const adminUser = {
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            fullName: 'System Admin',
            role: 'admin',
            permissions: {
                projectManagement: true,
                salesManagement: true,
                customerManagement: true,
                paymentManagement: true,
                reportManagement: true,
                userManagement: true
            },
            isActive: true
        };

        const existingAdmin = await User.findOne({ username: adminUser.username });
        
        if (existingAdmin) {
            console.log('Admin kullanıcısı zaten mevcut!');
            process.exit(0);
        }

        const user = await User.create(adminUser);
        console.log('Admin kullanıcısı başarıyla oluşturuldu:', user);
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

createAdminUser();
