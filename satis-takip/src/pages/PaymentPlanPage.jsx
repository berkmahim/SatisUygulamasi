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
        paymentType: 'cash', // cash, cash-installment, installment, balloon-payment
        downPayment: '',
        installmentCount: '',
        firstPaymentDate: new Date().toISOString().split('T')[0],
        balloonPayments: [] // Balon ödemeleri için yeni alan
    });
    const [calculatedPayments, setCalculatedPayments] = useState([]);

    // Tarih formatı yardımcı fonksiyonları
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return ''; // Tarih yoksa boş string döndür
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return ''; // Geçersiz tarih ise boş string döndür
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Invalid date:', dateString);
            return ''; // Hata durumunda boş string döndür
        }
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
        const { totalAmount, paymentType, downPayment, installmentCount, firstPaymentDate, balloonPayments } = paymentPlan;

        if (!totalAmount || !firstPaymentDate) return;

        // Kullanıcı tarafından manuel olarak ayarlanmış tarihler varsa onları koru
        const existingPayments = calculatedPayments.reduce((acc, payment) => {
            if (payment.id === 0 || payment.isAutoCalculated) {
                acc[payment.id] = null;
            } else {
                acc[payment.id] = payment.dueDate;
            }
            return acc;
        }, {});

        const payments = [];
        const baseDate = new Date(firstPaymentDate);

        if (paymentType === 'cash') {
            payments.push({
                id: 0,
                amount: parseFloat(totalAmount),
                dueDate: baseDate.toISOString().split('T')[0],
                description: 'Peşin Ödeme',
                isAutoCalculated: true
            });
        } else if (paymentType === 'cash-installment' && downPayment && installmentCount) {
            // Peşinat ödemesi
            payments.push({
                id: 0,
                amount: parseFloat(downPayment),
                dueDate: baseDate.toISOString().split('T')[0],
                description: 'Peşinat',
                isAutoCalculated: true
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
                    description: 'Taksit ' + (i + 1) + '/' + installmentCount,
                    isAutoCalculated: !existingPayments[i + 1]
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
                    description: 'Taksit ' + (i + 1) + '/' + installmentCount,
                    isAutoCalculated: !existingPayments[i]
                });
            }
        } else if (paymentType === 'balloon-payment' && installmentCount) {
            // Balon ödemeli plan hesaplamasını yapabiliriz
            if (balloonPayments.length > 0) {
                // Hesaplama için calculateBalloonPayments fonksiyonunu çağır
                const balloonPaymentResults = calculateBalloonPayments(
                    parseFloat(totalAmount), 
                    parseInt(installmentCount),
                    balloonPayments,
                    baseDate
                );
                
                if (balloonPaymentResults) {
                    payments.push(...balloonPaymentResults);
                }
            } else {
                // Balon ödemesi henüz tanımlanmamışsa normal taksitli ödeme gibi hesapla
                const installmentAmount = totalAmount / installmentCount;
                
                for (let i = 0; i < installmentCount; i++) {
                    const defaultDueDate = new Date(baseDate);
                    defaultDueDate.setMonth(baseDate.getMonth() + i);
                    
                    payments.push({
                        id: i,
                        amount: installmentAmount,
                        dueDate: defaultDueDate.toISOString().split('T')[0],
                        description: 'Taksit ' + (i + 1) + '/' + installmentCount,
                        isAutoCalculated: true
                    });
                }
            }
        }

        setCalculatedPayments(payments);
    };

    // Balon ödemeli plan için hesaplama fonksiyonu
    const calculateBalloonPayments = (totalAmount, installmentCount, balloonPayments, baseDate) => {
        // Geçerli balon ödemeleri filtrele (boş olmayanlar)
        const validBalloonPayments = balloonPayments.filter(bp => 
            bp.amount && parseFloat(bp.amount) > 0 && bp.dueDate
        );

        if (validBalloonPayments.length === 0) return null;

        // Toplam balon ödeme tutarını hesapla
        const totalBalloonAmount = validBalloonPayments.reduce(
            (sum, payment) => sum + parseFloat(payment.amount), 0
        );
        
        // Balon ödemeler toplam tutardan büyük olamaz
        if (totalBalloonAmount >= totalAmount) {
            alert('Balon ödemelerin toplamı, toplam tutardan büyük veya eşit olamaz!');
            return null;
        }
        
        // Kalan tutar (normal taksitler için)
        const remainingAmount = totalAmount - totalBalloonAmount;
        const regularInstallmentCount = installmentCount - validBalloonPayments.length;
        
        if (regularInstallmentCount <= 0) {
            alert('Normal taksit sayısı en az 1 olmalıdır!');
            return null;
        }
        
        // Normal taksit tutarı
        const regularInstallmentAmount = remainingAmount / regularInstallmentCount;
        
        let allPayments = [];
        
        // Tüm taksitleri oluştur
        for (let i = 0; i < installmentCount; i++) {
            const defaultDueDate = new Date(baseDate);
            defaultDueDate.setMonth(baseDate.getMonth() + i);
            
            // Bu taksit ayında balon ödeme var mı kontrol et
            const balloonForThisMonth = validBalloonPayments.find(bp => {
                if (!bp.dueDate) return false;
                
                const bpDate = new Date(bp.dueDate);
                const thisMonth = defaultDueDate.getMonth();
                const thisYear = defaultDueDate.getFullYear();
                
                return bpDate.getMonth() === thisMonth && bpDate.getFullYear() === thisYear;
            });
            
            if (balloonForThisMonth) {
                // Bu bir balon ödeme
                allPayments.push({
                    id: i,
                    amount: parseFloat(balloonForThisMonth.amount),
                    dueDate: balloonForThisMonth.dueDate,
                    description: `Balon Ödeme (${i+1}. Taksit)`,
                    isAutoCalculated: false,
                    isBalloon: true
                });
            } else {
                // Bu normal bir taksit
                allPayments.push({
                    id: i,
                    amount: regularInstallmentAmount,
                    dueDate: defaultDueDate.toISOString().split('T')[0],
                    description: `Normal Taksit (${i+1}/${installmentCount})`,
                    isAutoCalculated: true
                });
            }
        }
        
        // Tarihe göre sırala
        allPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        // ID'leri yeniden ata
        return allPayments.map((payment, index) => ({
            ...payment,
            id: index
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Önceki state değerlerini saklayın
        const prevState = {...paymentPlan};
        
        setPaymentPlan(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Eğer firstPaymentDate değiştiyse, tüm taksit tarihlerini sıfırla ve yeniden hesaplat
        if (name === 'firstPaymentDate' && value !== prevState.firstPaymentDate) {
            // Tüm hesaplanmış ödemelerin isAutoCalculated değerini true yap
            // böylece calculatePayments tüm tarihleri yeniden hesaplayabilir
            setCalculatedPayments(prevPayments => 
                prevPayments.map(payment => ({
                    ...payment,
                    isAutoCalculated: true
                }))
            );
        }
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
                    ? { ...payment, dueDate: newDate, isAutoCalculated: false }
                    : payment
            )
        );
    };

    const handleBalloonPaymentChange = (index, newAmount, newDueDate) => {
        setPaymentPlan(prev => ({
            ...prev,
            balloonPayments: prev.balloonPayments.map((balloonPayment, i) => 
                i === index 
                    ? { ...balloonPayment, amount: newAmount, dueDate: newDueDate }
                    : balloonPayment
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Ödeme tarihlerini kontrol et ve geçerli tarihler olduğundan emin ol
            const formattedPayments = calculatedPayments.map(payment => ({
                amount: parseFloat(payment.amount),
                dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
                description: payment.description,
                status: 'pending',
                isBalloon: payment.isBalloon || false // Balon ödemesi bilgisini ekle
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
                payments: sortedPayments,
                // Balon ödeme tipi seçiliyse
                balloonPayments: paymentPlan.paymentType === 'balloon-payment' ? 
                    paymentPlan.balloonPayments.filter(bp => bp.amount && bp.dueDate) : 
                    undefined
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
                                style={{ backgroundColor: 'white' }}
                                color="black"
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
                                style={{ backgroundColor: 'white' }}
                                color="black"
                            >
                                <option value="cash">Peşin</option>
                                <option value="cash-installment">Peşin + Taksit</option>
                                <option value="installment">Taksit</option>
                                <option value="balloon-payment">Balon Ödemeli</option>
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
                                    style={{ backgroundColor: 'white' }}
                                    color="black"
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
                                    style={{ backgroundColor: 'white' }}
                                    color="black"
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
                                style={{ backgroundColor: 'white' }}
                                color="black"
                            />
                        </div>
                    </div>

                    {paymentPlan.paymentType === 'balloon-payment' && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Balon Ödemeleri</h3>
                            {paymentPlan.balloonPayments.map((balloonPayment, index) => (
                                <div key={index} className="flex items-center gap-4 mb-4">
                                    <input
                                        type="number"
                                        value={balloonPayment.amount}
                                        onChange={(e) => handleBalloonPaymentChange(index, e.target.value, balloonPayment.dueDate)}
                                        className="w-full p-2 border rounded"
                                        required
                                        style={{ backgroundColor: 'white' }}
                                        color="black"
                                    />
                                    <input
                                        type="date"
                                        value={formatDateForInput(balloonPayment.dueDate)}
                                        onChange={(e) => handleBalloonPaymentChange(index, balloonPayment.amount, e.target.value)}
                                        className="w-full p-2 border rounded"
                                        required
                                        style={{ backgroundColor: 'white' }}
                                        color="black"
                                    />
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setPaymentPlan(prev => ({
                                    ...prev,
                                    balloonPayments: [...prev.balloonPayments, { 
                                        amount: '', 
                                        dueDate: new Date().toISOString().split('T')[0] // Varsayılan olarak bugünün tarihini ekle
                                    }]
                                }))}
                                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Balon Ödemesi Ekle
                            </button>
                        </div>
                    )}

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
                                                            style={{ backgroundColor: 'white' }}
                                                            color="black"
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
