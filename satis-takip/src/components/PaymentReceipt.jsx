import React, { useState } from 'react';
import { Button, Modal, Spin, message } from 'antd';
import { PrinterOutlined, DownloadOutlined, MailOutlined } from '@ant-design/icons';
import { generatePaymentReceipt } from '../services/documentService';
import { sendPaymentReminder } from '../services/notificationService';

const getPaymentMethodText = (method) => {
    const methods = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Havale/EFT',
        'check': 'Çek'
    };
    return methods[method] || method;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Tarih formatı hatası:', error);
        return '-';
    }
};

const PaymentReceipt = ({ payment, visible, onClose }) => {
    const [loading, setLoading] = useState(false);

    const getReceiptContent = () => {
        // Gelen veriyi kontrol et
        console.log('Full payment data:', payment);
        console.log('Sale:', payment.sale);
        console.log('Customer:', payment.sale?.customer, payment.customerName);
        console.log('Project:', payment.sale?.project, payment.projectName);
        console.log('Unit:', payment.sale?.unit, payment.unitNumber);

        const formattedDate = formatDate(payment.paymentDate || payment.paidDate);
        const formattedAmount = typeof payment.paidAmount === 'number' ? 
            payment.paidAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '-';
        
        // Veri alanlarını temizle ve kontrol et
        const customerName = (
            payment.customerName ||
            payment.sale?.customer?.name ||
            '-'
        ).trim();

        const projectName = (
            payment.projectName ||
            payment.sale?.project?.name ||
            '-'
        ).trim();

        const unitNumber = (
            payment.unitNumber ||
            payment.sale?.unit?.number ||
            '-'
        ).toString().trim();
        
        return `
            <div class="receipt">
                <div class="header">
                    <h1>Ödeme Makbuzu</h1>
                </div>
                <div class="content">
                    <div class="row">
                        <span class="label">Ödeme Tarihi:</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="row">
                        <span class="label">Ödeme Tutarı:</span>
                        <span>${formattedAmount}</span>
                    </div>
                    <div class="row">
                        <span class="label">Ödeme Yöntemi:</span>
                        <span>${getPaymentMethodText(payment.paymentMethod)}</span>
                    </div>
                    <div class="row">
                        <span class="label">Müşteri:</span>
                        <span>${customerName}</span>
                    </div>
                    <div class="row">
                        <span class="label">Proje:</span>
                        <span>${projectName}</span>
                    </div>
                    <div class="row">
                        <span class="label">Daire No:</span>
                        <span>${unitNumber}</span>
                    </div>
                    ${payment.notes ? `
                    <div class="row">
                        <span class="label">Notlar:</span>
                        <span>${payment.notes}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="footer">
                    <p>Bu bir resmi makbuzdur.</p>
                </div>
            </div>
        `;
    };

    const handlePrint = async () => {
        try {
            setLoading(true);
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Ödeme Makbuzu</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .receipt { max-width: 800px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .content { margin-bottom: 30px; }
                            .row { margin: 10px 0; }
                            .label { font-weight: bold; width: 150px; display: inline-block; }
                            .footer { text-align: center; margin-top: 50px; }
                        </style>
                    </head>
                    <body>
                        ${getReceiptContent()}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } catch (error) {
            message.error('Makbuz yazdırılırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            const printContent = `
                <html>
                    <head>
                        <title>Ödeme Makbuzu</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .receipt { max-width: 800px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .content { margin-bottom: 30px; }
                            .row { margin: 10px 0; }
                            .label { font-weight: bold; width: 150px; display: inline-block; }
                            .footer { text-align: center; margin-top: 50px; }
                        </style>
                    </head>
                    <body>
                        ${getReceiptContent()}
                    </body>
                </html>
            `;
            
            const blob = new Blob([printContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `odeme_makbuz_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            message.success('Makbuz başarıyla indirildi');
        } catch (error) {
            message.error('Makbuz indirilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            setLoading(true);
            await sendPaymentReminder(payment.id);
            message.success('Makbuz e-posta olarak gönderildi');
        } catch (error) {
            message.error('Makbuz gönderilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Ödeme Makbuzu"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                    Yazdır
                </Button>,
                <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
                    İndir
                </Button>,
                <Button key="email" icon={<MailOutlined />} onClick={handleSendEmail}>
                    E-posta Gönder
                </Button>,
            ]}
            width={600}
        >
            <Spin spinning={loading}>
                <div className="receipt-preview" style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Ödeme Tarihi:</strong> {formatDate(payment.paymentDate || payment.paidDate)}</p>
                        <p><strong>Ödeme Tutarı:</strong> {payment.paidAmount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '-'}</p>
                        <p><strong>Ödeme Yöntemi:</strong> {getPaymentMethodText(payment.paymentMethod)}</p>
                        <p><strong>Müşteri:</strong> {payment.customerName?.trim() || '-'}</p>
                        <p><strong>Proje:</strong> {payment.projectName?.trim() || '-'}</p>
                        <p><strong>Daire No:</strong> {payment.unitNumber?.toString().trim() || '-'}</p>
                        {payment.notes && <p><strong>Notlar:</strong> {payment.notes}</p>}
                    </div>
                </div>
            </Spin>
        </Modal>
    );
};

export default PaymentReceipt;
