import nodemailer from 'nodemailer';
import { formatCurrency, formatDate } from '../utils/formatters.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendPaymentOverdueEmail(user, notification) {
        const { relatedData } = notification;
        const emailTemplate = `
            <h2>Geciken Ödeme Bildirimi</h2>
            <p>Sayın ${user.firstName} ${user.lastName},</p>
            <p>Aşağıdaki ödeme gecikmiştir:</p>
            <ul>
                <li><strong>Müşteri:</strong> ${relatedData.customer.firstName} ${relatedData.customer.lastName}</li>
                <li><strong>Tutar:</strong> ${formatCurrency(relatedData.amount)}</li>
                <li><strong>Vade Tarihi:</strong> ${formatDate(relatedData.dueDate)}</li>
                <li><strong>Gecikme Süresi:</strong> ${this.calculateOverdueDays(relatedData.dueDate)} gün</li>
            </ul>
            <p>Detaylı bilgi için <a href="${process.env.APP_URL}/payments/${relatedData.paymentId}">tıklayınız</a>.</p>
        `;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: 'Geciken Ödeme Bildirimi',
            html: emailTemplate
        });
    }

    calculateOverdueDays(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = Math.abs(now - due);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

export default new EmailService();
