import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PaymentTracking = () => {
    const { saleId } = useParams();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        paidAmount: '',
        paymentMethod: 'cash',
        notes: ''
    });

    useEffect(() => {
        fetchPaymentDetails();
    }, [saleId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/payments/${saleId}`);
            setPaymentDetails(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayment) return;

        try {
            await axios.post(`/api/payments/${saleId}`, {
                paymentId: selectedPayment.id,
                paidAmount: parseFloat(paymentForm.paidAmount.replace(/[.,]/g, '')),
                paymentMethod: paymentForm.paymentMethod,
                notes: paymentForm.notes || undefined,
                paidDate: new Date()
            });
            
            // Formu sıfırla ve detayları yenile
            setPaymentForm({
                paidAmount: '',
                paymentMethod: 'cash',
                notes: ''
            });
            setSelectedPayment(null);
            setError(null);
            fetchPaymentDetails();
        } catch (error) {
            setError(error.response?.data?.message || 'Ödeme kaydedilirken bir hata oluştu');
        }
    };

    // Para formatı (1234.567 -> 1.234,567 TL)
    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '0,000 TL';
        return amount.toLocaleString('tr-TR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' TL';
    };

    // Input değişikliklerini yönet
    const handleAmountChange = (e) => {
        let value = e.target.value;
        
        // Sadece sayılar ve virgül
        value = value.replace(/[^0-9,]/g, '');
        
        // Virgülden sonra en fazla 2 basamak
        const parts = value.split(',');
        if (parts[1] && parts[1].length > 2) {
            parts[1] = parts[1].slice(0, 2);
            value = parts.join(',');
        }

        setPaymentForm({
            ...paymentForm,
            paidAmount: value
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'text-green-600';
            case 'partial':
                return 'text-yellow-600';
            case 'overdue':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid':
                return 'Ödendi';
            case 'partial':
                return 'Kısmi Ödeme';
            case 'overdue':
                return 'Gecikmiş';
            case 'pending':
                return 'Bekliyor';
            default:
                return status;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600">
                Hata: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Ödeme Özeti */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Ödeme Özeti</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-600">Toplam Tutar</p>
                            <p className="text-xl font-semibold">
                                {paymentDetails.totalAmount?.toLocaleString('tr-TR')} TL
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Ödenen Tutar</p>
                            <p className="text-xl font-semibold text-green-600">
                                {paymentDetails.totalPaidAmount?.toLocaleString('tr-TR')} TL
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Kalan Tutar</p>
                            <p className="text-xl font-semibold text-blue-600">
                                {paymentDetails.remainingAmount?.toLocaleString('tr-TR')} TL
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Durum</p>
                            <p className={`text-xl font-semibold ${getStatusColor(paymentDetails.paymentStatus)}`}>
                                {getStatusText(paymentDetails.paymentStatus)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ödeme Listesi */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Ödeme Planı</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left">Açıklama</th>
                                    <th className="px-4 py-2 text-left">Vade Tarihi</th>
                                    <th className="px-4 py-2 text-right">Tutar</th>
                                    <th className="px-4 py-2 text-right">Ödenen</th>
                                    <th className="px-4 py-2 text-right">Kalan</th>
                                    <th className="px-4 py-2 text-center">Durum</th>
                                    <th className="px-4 py-2 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentDetails.payments.map((payment, index) => (
                                    <tr
                                        key={payment.id}
                                        className={`border-t ${
                                            selectedPayment?.id === payment.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-2">
                                            {payment.description}
                                            <br />
                                            <span className="text-sm text-gray-500">
                                                {payment.isAdvancePayment ? 
                                                    'Peşinat' : 
                                                    `Taksit ${payment.installmentNumber - 1} / ${paymentDetails.payments.length - 1}`
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {new Date(payment.dueDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {formatAmount(payment.amount)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-green-600">
                                            {formatAmount(payment.paidAmount)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-blue-600">
                                            {formatAmount(payment.remainingAmount)}
                                        </td>
                                        <td className={`px-4 py-2 text-center ${getStatusColor(payment.status)}`}>
                                            {getStatusText(payment.status)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {payment.status !== 'paid' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setPaymentForm({
                                                            ...paymentForm,
                                                            paidAmount: payment.remainingAmount.toString()
                                                        });
                                                    }}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                >
                                                    Ödeme Al
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ödeme Formu */}
                {selectedPayment && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {selectedPayment.description} (Taksit {selectedPayment.installmentNumber} / {paymentDetails.payments.length})
                        </h2>
                        <form onSubmit={handlePaymentSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">
                                        Ödeme Tutarı
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentForm.paidAmount}
                                        onChange={(e) => setPaymentForm({
                                            ...paymentForm,
                                            paidAmount: e.target.value
                                        })}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">
                                        Ödeme Yöntemi
                                    </label>
                                    <select
                                        value={paymentForm.paymentMethod}
                                        onChange={(e) =>
                                            setPaymentForm({
                                                ...paymentForm,
                                                paymentMethod: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                        required
                                    >
                                        <option value="cash">Nakit</option>
                                        <option value="bank_transfer">Havale/EFT</option>
                                        <option value="credit_card">Kredi Kartı</option>
                                        <option value="check">Çek</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 mb-2">
                                        Notlar (Opsiyonel)
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentForm.notes}
                                        onChange={(e) =>
                                            setPaymentForm({
                                                ...paymentForm,
                                                notes: e.target.value
                                            })
                                        }
                                        className="w-full p-2 border rounded"
                                        placeholder="Ödeme ile ilgili notlar..."
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPayment(null)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Ödemeyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentTracking;
