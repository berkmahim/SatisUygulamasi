import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Card, 
    Typography, 
    Input, 
    Button, 
    Select, 
    Table, 
    Space, 
    Row, 
    Col, 
    Divider, 
    message,
    InputNumber,
    Form
} from 'antd';
import { ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import { createBulkSale } from '../services/saleService';

const { Title, Text } = Typography;
const { Option } = Select;

const BulkPaymentPlanPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { customer, selectedBlockIds, blocks } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Unit pricing state
    const [unitPrices, setUnitPrices] = useState({});
    const [totalAmount, setTotalAmount] = useState(0);
    
    // Payment plan state (exact same structure as single sale PaymentPlanPage)
    const [paymentPlan, setPaymentPlan] = useState({
        paymentType: 'cash', // cash, cash-installment, installment, balloon-payment
        downPayment: '',
        installmentCount: 12,
        firstPaymentDate: new Date().toISOString().split('T')[0],
        balloonPayments: [] // Balon ödemeleri için yeni alan
    });
    const [calculatedPayments, setCalculatedPayments] = useState([]);

    useEffect(() => {
        if (!customer || !selectedBlockIds || !blocks) {
            navigate(`/projects/${projectId}/building`);
            return;
        }
        
        // Initialize unit prices with empty values
        const initialPrices = {};
        selectedBlockIds.forEach(blockId => {
            initialPrices[blockId] = '';
        });
        setUnitPrices(initialPrices);
    }, [customer, selectedBlockIds, blocks, navigate, projectId]);

    // Calculate total amount when unit prices change
    useEffect(() => {
        const total = Object.values(unitPrices)
            .filter(price => price && !isNaN(price))
            .reduce((sum, price) => sum + parseFloat(price), 0);
        setTotalAmount(total);
    }, [unitPrices]);

    // Recalculate payment plan when total amount or plan settings change
    useEffect(() => {
        calculatePayments();
    }, [totalAmount, paymentPlan]);

    const handleUnitPriceChange = (blockId, value) => {
        setUnitPrices(prev => ({
            ...prev,
            [blockId]: value
        }));
    };

    // Tarih formatı yardımcı fonksiyonları (exact copy from single sale)
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

    // Payment calculation logic (exact copy from single sale PaymentPlanPage)
    const calculatePayments = () => {
        const { paymentType, downPayment, installmentCount, firstPaymentDate, balloonPayments } = paymentPlan;

        if (!totalAmount || !firstPaymentDate) {
            setCalculatedPayments([]);
            return;
        }

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

    // Balon ödemeli plan için hesaplama fonksiyonu (exact copy from single sale)
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

    // Handle input changes (exact copy from single sale)
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

    // Handle payment date changes (exact copy from single sale)
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

    // Handle balloon payment changes (exact copy from single sale)
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

    const handleSubmit = async () => {
        // Validation
        const allPricesEntered = selectedBlockIds.every(blockId => 
            unitPrices[blockId] && !isNaN(unitPrices[blockId]) && parseFloat(unitPrices[blockId]) > 0
        );

        if (!allPricesEntered) {
            message.error('Lütfen tüm birimlerin fiyatlarını girin');
            return;
        }

        if (totalAmount <= 0) {
            message.error('Toplam tutar 0\'dan büyük olmalıdır');
            return;
        }

        if (calculatedPayments.length === 0) {
            message.error('Ödeme planı hesaplanamadı');
            return;
        }

        try {
            setSubmitting(true);

            // Create a unified bulk sale record
            const bulkSaleData = {
                isBulkSale: true,
                bulkSaleId: `BULK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                projectId,
                customerId: customer._id,
                type: 'sale',
                totalAmount: totalAmount,
                paymentPlan: paymentPlan.paymentType,
                downPayment: paymentPlan.downPayment || 0,
                installmentCount: paymentPlan.installmentCount,
                firstPaymentDate: paymentPlan.firstPaymentDate,
                
                // Include the payment plan - updated to match single sale format
                payments: calculatedPayments.map(payment => ({
                    amount: parseFloat(payment.amount),
                    dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
                    description: payment.description,
                    status: 'pending',
                    isBalloon: payment.isBalloon || false // Balon ödemesi bilgisini ekle
                })),
                
                // Add balloon payments info if balloon payment type
                balloonPayments: paymentPlan.paymentType === 'balloon-payment' ? 
                    paymentPlan.balloonPayments.filter(bp => bp.amount && bp.dueDate) : 
                    undefined,
                
                // Include all blocks and their prices
                bulkSaleBlocks: selectedBlockIds.map(blockId => ({
                    blockId,
                    unitPrice: parseFloat(unitPrices[blockId])
                }))
            };

            await createBulkSale(bulkSaleData);
            
            message.success('Toplu satış başarıyla oluşturuldu!');
            navigate(`/projects/${projectId}`);
            
        } catch (error) {
            console.error('Bulk sale creation error:', error);
            message.error('Toplu satış oluşturulurken bir hata oluştu: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Table columns for unit pricing
    const unitColumns = [
        {
            title: 'Birim',
            dataIndex: 'unitInfo',
            key: 'unitInfo',
        },
        {
            title: 'Tür',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Alan (m²)',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: 'Birim Fiyatı (₺)',
            key: 'price',
            render: (_, record) => (
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Fiyat girin"
                    formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/₺\s?|(,*)/g, '')}
                    value={unitPrices[record.blockId]}
                    onChange={(value) => handleUnitPriceChange(record.blockId, value)}
                />
            ),
        },
    ];

    // Table columns for payment plan - updated to match single sale with editable dates
    const paymentColumns = [
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Tutar (TL)',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => parseFloat(amount).toLocaleString('tr-TR'),
        },
        {
            title: 'Vade Tarihi',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date, record, index) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text style={{ color: '#666', minWidth: '100px' }}>
                        {formatDateForDisplay(date)}
                    </Text>
                    <Input
                        type="date"
                        size="small"
                        value={formatDateForInput(date)}
                        onChange={(e) => handlePaymentDateChange(record.id, e.target.value)}
                        style={{ width: '140px' }}
                    />
                </div>
            ),
        },
    ];

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    // Prepare unit data for table
    const unitData = blocks?.map(block => ({
        key: block._id || block.id,
        blockId: block._id || block.id,
        unitInfo: `Birim ${block.unitNumber || block._id?.slice(-6) || block.id?.slice(-6)}`,
        type: block.type === 'apartment' ? 'Daire' : 'Ofis',
        area: block.squareMeters || '-',
    })) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-6">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate(-1)}
                        style={{ marginRight: 16 }}
                    >
                        Geri
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        Toplu Satış - Ödeme Planı
                    </Title>
                </div>

                {/* Customer Info */}
                <Card title="Müşteri Bilgileri" className="mb-6">
                    <Text strong style={{ fontSize: '16px' }}>
                        {customer.firstName} {customer.lastName}
                    </Text>
                    <br />
                    <Text type="secondary">{customer.email} • {customer.phone}</Text>
                </Card>

                <Row gutter={[24, 24]}>
                    {/* Left Column - Unit Pricing */}
                    <Col xs={24} lg={12}>
                        <Card title="Birim Fiyatları" className="mb-6">
                            <Table
                                columns={unitColumns}
                                dataSource={unitData}
                                rowKey="key"
                                pagination={false}
                                size="small"
                                footer={() => (
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
                                        Toplam: ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                )}
                            />
                        </Card>

                        {/* Payment Plan Settings - exact copy from single sale */}
                        <Card title="Ödeme Planı Ayarları" className="mb-6">
                            <Form layout="vertical">
                                <Form.Item label="Ödeme Türü">
                                    <Select 
                                        value={paymentPlan.paymentType} 
                                        onChange={(value) => handleInputChange({ target: { name: 'paymentType', value } })}
                                        size="large"
                                    >
                                        <Option value="cash">Peşin</Option>
                                        <Option value="cash-installment">Peşin + Taksit</Option>
                                        <Option value="installment">Taksit</Option>
                                        <Option value="balloon-payment">Balon Ödemeli</Option>
                                    </Select>
                                </Form.Item>

                                {paymentPlan.paymentType === 'cash-installment' && (
                                    <Form.Item label="Peşinat Tutarı (TL)">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            size="large"
                                            min={0}
                                            max={totalAmount}
                                            formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/₺\s?|(,*)/g, '')}
                                            value={paymentPlan.downPayment}
                                            onChange={(value) => handleInputChange({ target: { name: 'downPayment', value } })}
                                        />
                                    </Form.Item>
                                )}

                                {paymentPlan.paymentType !== 'cash' && (
                                    <Form.Item label="Taksit Sayısı">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            size="large"
                                            min={1}
                                            max={60}
                                            value={paymentPlan.installmentCount}
                                            onChange={(value) => handleInputChange({ target: { name: 'installmentCount', value } })}
                                        />
                                    </Form.Item>
                                )}

                                <Form.Item label="İlk Ödeme Tarihi">
                                    <Input
                                        type="date"
                                        size="large"
                                        name="firstPaymentDate"
                                        value={paymentPlan.firstPaymentDate}
                                        onChange={handleInputChange}
                                    />
                                </Form.Item>
                            </Form>

                            {/* Balloon Payment Section - exact copy from single sale */}
                            {paymentPlan.paymentType === 'balloon-payment' && (
                                <div className="mt-6">
                                    <Title level={4} style={{ marginBottom: '16px' }}>Balon Ödemeleri</Title>
                                    {paymentPlan.balloonPayments.map((balloonPayment, index) => (
                                        <Row key={index} gutter={16} style={{ marginBottom: '16px' }}>
                                            <Col span={12}>
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="Tutar"
                                                    min={0}
                                                    formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => value.replace(/₺\s?|(,*)/g, '')}
                                                    value={balloonPayment.amount}
                                                    onChange={(value) => handleBalloonPaymentChange(index, value, balloonPayment.dueDate)}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Input
                                                    type="date"
                                                    value={formatDateForInput(balloonPayment.dueDate)}
                                                    onChange={(e) => handleBalloonPaymentChange(index, balloonPayment.amount, e.target.value)}
                                                />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={() => setPaymentPlan(prev => ({
                                            ...prev,
                                            balloonPayments: [...prev.balloonPayments, { 
                                                amount: '', 
                                                dueDate: new Date().toISOString().split('T')[0]
                                            }]
                                        }))}
                                        style={{ width: '100%', marginTop: '8px' }}
                                    >
                                        + Balon Ödemesi Ekle
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Right Column - Payment Plan Preview */}
                    <Col xs={24} lg={12}>
                        <Card title="Ödeme Planı Önizlemesi" className="mb-6">
                            {calculatedPayments.length > 0 ? (
                                <Table
                                    columns={paymentColumns}
                                    dataSource={calculatedPayments}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    scroll={{ y: 400 }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                                    <br />
                                    Ödeme planı hesaplanıyor...
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Action Buttons */}
                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                    <Space size="large">
                        <Button size="large" onClick={() => navigate(-1)}>
                            İptal
                        </Button>
                        <Button 
                            type="primary" 
                            size="large"
                            loading={submitting}
                            onClick={handleSubmit}
                            disabled={totalAmount <= 0 || calculatedPayments.length === 0}
                        >
                            Toplu Satışı Tamamla
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default BulkPaymentPlanPage;