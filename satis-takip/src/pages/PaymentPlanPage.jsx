import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBlockById } from '../services/blockService';
import { createSale } from '../services/saleService';

const PaymentPlanPage = () => {
    const { projectId, blockId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { customer } = location.state || {};

    const [block, setBlock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentPlan, setPaymentPlan] = useState({
        totalAmount: '',
        paymentType: 'cash', // cash, cash-installment, installment
        downPayment: '',
        installmentCount: '',
        firstPaymentDate: new Date().toISOString().split('T')[0]
    });
    const [calculatedPayments, setCalculatedPayments] = useState([]);

    // Tarih formatı yardımcı fonksiyonları
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const data = await getBlockById(blockId);
                setBlock(data);
            } catch (error) {
                console.error('Error fetching block:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlock();
    }, [blockId]);

    useEffect(() => {
        calculatePayments();
    }, [paymentPlan]);

    const calculatePayments = () => {
        const { totalAmount, paymentType, downPayment, installmentCount, firstPaymentDate } = paymentPlan;

        if (!totalAmount || !firstPaymentDate) return;

        // Mevcut ödemeleri kontrol et
        const existingPayments = calculatedPayments.reduce((acc, payment) => {
            acc[payment.id] = payment.dueDate;
            return acc;
        }, {});

        const payments = [];
        const baseDate = new Date(firstPaymentDate);

        if (paymentType === 'cash') {
            payments.push({
                id: 0,
                amount: parseFloat(totalAmount),
                dueDate: existingPayments[0] || baseDate.toISOString().split('T')[0],
                description: 'Peşin Ödeme'
            });
        } else if (paymentType === 'cash-installment' && downPayment && installmentCount) {
            // Peşinat ödemesi
            payments.push({
                id: 0,
                amount: parseFloat(downPayment),
                dueDate: existingPayments[0] || baseDate.toISOString().split('T')[0],
                description: 'Peşinat'
            });

            // Taksitler
            const remainingAmount = totalAmount - downPayment;
            const installmentAmount = remainingAmount / installmentCount;

            for (let i = 0; i < installmentCount; i++) {
                const defaultDueDate = new Date(baseDate);
                defaultDueDate.setMonth(baseDate.getMonth() + i + 1);
                
                payments.push({
                    id: i + 1,
                    amount: installmentAmount,
                    dueDate: existingPayments[i + 1] || defaultDueDate.toISOString().split('T')[0],
                    description: 'Taksit ' + (i + 1) + '/' + installmentCount
                });
            }
        } else if (paymentType === 'installment' && installmentCount) {
            const installmentAmount = totalAmount / installmentCount;

            for (let i = 0; i < installmentCount; i++) {
                const defaultDueDate = new Date(baseDate);
                defaultDueDate.setMonth(baseDate.getMonth() + i);
                
                payments.push({
                    id: i,
                    amount: installmentAmount,
                    dueDate: existingPayments[i] || defaultDueDate.toISOString().split('T')[0],
                    description: 'Taksit ' + (i + 1) + '/' + installmentCount
                });
            }
        }

        setCalculatedPayments(payments);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentPlan(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentDateChange = (paymentId, newDate) => {
        // Tarih formatını kontrol et
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            console.error('Geçersiz tarih formatı:', newDate);
            return;
        }

        // Tarihin geçerli olduğunu kontrol et
        const date = new Date(newDate);
        if (isNaN(date.getTime())) {
            console.error('Geçersiz tarih:', newDate);
            return;
        }

        setCalculatedPayments(prevPayments => 
            prevPayments.map(payment => 
                payment.id === paymentId 
                    ? { ...payment, dueDate: newDate }
                    : payment
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Ödeme tarihlerini kontrol et ve geçerli tarihler olduğundan emin ol
            const formattedPayments = calculatedPayments.map(payment => ({
                amount: parseFloat(payment.amount),
                dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
                description: payment.description,
                status: 'pending'
            }));

            // Tarihlerin sıralı olduğunu kontrol et
            const sortedPayments = [...formattedPayments].sort((a, b) => 
                new Date(a.dueDate) - new Date(b.dueDate)
            );

            // Tarih formatını kontrol et
            const invalidDates = sortedPayments.filter(payment => 
                isNaN(new Date(payment.dueDate).getTime())
            );

            if (invalidDates.length > 0) {
                throw new Error('Geçersiz vade tarihi formatı tespit edildi');
            }

            const saleData = {
                blockId,
                customerId: customer._id,
                type: 'sale',
                totalAmount: parseFloat(paymentPlan.totalAmount),
                paymentPlan: paymentPlan.paymentType,
                downPayment: paymentPlan.paymentType === 'cash-installment' ? parseFloat(paymentPlan.downPayment) : undefined,
                installmentCount: paymentPlan.paymentType !== 'cash' ? parseInt(paymentPlan.installmentCount) : undefined,
                firstPaymentDate: sortedPayments[0].dueDate,
                payments: sortedPayments
            };

            await createSale(saleData);
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Satış oluşturulurken bir hata oluştu');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    if (!customer) {
        return <div className="flex justify-center items-center h-screen">Müşteri bilgisi bulunamadı</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Ödeme Planı Oluştur</h1>

                {/* Blok ve Müşteri Bilgileri */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Blok Bilgileri</h2>
                        <div className="space-y-2">
                            <p><span className="font-medium">Blok ID:</span> {block?._id}</p>
                            <p><span className="font-medium">Tipi:</span> {block?.type || 'Belirtilmemiş'}</p>
                            <p><span className="font-medium">Birim No:</span> {block?.unitNumber || 'Belirtilmemiş'}</p>
                            <p><span className="font-medium">Metrekare:</span> {block?.squareMeters || 'Belirtilmemiş'}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
                        <div className="space-y-2">
                            <p><span className="font-medium">Ad Soyad:</span> {customer.firstName} {customer.lastName}</p>
                            <p><span className="font-medium">TC:</span> {customer.tcNo}</p>
                            <p><span className="font-medium">Telefon:</span> {customer.phone}</p>
                            <p><span className="font-medium">E-posta:</span> {customer.email}</p>
                        </div>
                    </div>
                </div>

                {/* Ödeme Planı Formu */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Ödeme Planı</h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Toplam Tutar (TL)
                            </label>
                            <input
                                type="number"
                                name="totalAmount"
                                value={paymentPlan.totalAmount}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ödeme Tipi
                            </label>
                            <select
                                name="paymentType"
                                value={paymentPlan.paymentType}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="cash">Peşin</option>
                                <option value="cash-installment">Peşin + Taksit</option>
                                <option value="installment">Taksit</option>
                            </select>
                        </div>

                        {paymentPlan.paymentType === 'cash-installment' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Peşinat Tutarı (TL)
                                </label>
                                <input
                                    type="number"
                                    name="downPayment"
                                    value={paymentPlan.downPayment}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        )}

                        {paymentPlan.paymentType !== 'cash' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Taksit Sayısı
                                </label>
                                <input
                                    type="number"
                                    name="installmentCount"
                                    value={paymentPlan.installmentCount}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                İlk Ödeme Tarihi
                            </label>
                            <input
                                type="date"
                                name="firstPaymentDate"
                                value={paymentPlan.firstPaymentDate}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    </div>

                    {/* Ödeme Planı Tablosu */}
                    {calculatedPayments.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Ödeme Planı Özeti</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left">Açıklama</th>
                                            <th className="px-4 py-2 text-left">Tutar (TL)</th>
                                            <th className="px-4 py-2 text-left">Vade Tarihi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculatedPayments.map((payment, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="px-4 py-2">{payment.description}</td>
                                                <td className="px-4 py-2">{payment.amount.toLocaleString('tr-TR')}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-600">
                                                            {formatDateForDisplay(payment.dueDate)}
                                                        </span>
                                                        <input
                                                            type="date"
                                                            value={formatDateForInput(payment.dueDate)}
                                                            onChange={(e) => handlePaymentDateChange(payment.id, e.target.value)}
                                                            className="p-1 border rounded"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            type="button"
                            onClick={() => navigate(`/projects/${projectId}`)}
                            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Satışı Tamamla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentPlanPage;
