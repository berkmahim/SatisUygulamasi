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
    
    // Payment plan state (same structure as original PaymentPlanPage)
    const [paymentPlan, setPaymentPlan] = useState({
        paymentType: 'cash', // cash, cash-installment, installment, balloon-payment
        downPayment: '',
        installmentCount: 12,
        firstPaymentDate: new Date().toISOString().split('T')[0],
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

    // Payment calculation logic (reused from original PaymentPlanPage)
    const calculatePayments = () => {
        const { paymentType, downPayment, installmentCount, firstPaymentDate } = paymentPlan;

        if (!totalAmount || totalAmount <= 0 || !firstPaymentDate) {
            setCalculatedPayments([]);
            return;
        }

        const payments = [];
        const baseDate = new Date(firstPaymentDate);

        if (paymentType === 'cash') {
            payments.push({
                id: 0,
                amount: totalAmount,
                dueDate: baseDate.toISOString().split('T')[0],
                description: 'Peşin Ödeme',
                installmentNumber: 1
            });
        } else if (paymentType === 'cash-installment' && downPayment && installmentCount) {
            // Peşinat ödemesi
            payments.push({
                id: 0,
                amount: parseFloat(downPayment),
                dueDate: baseDate.toISOString().split('T')[0],
                description: 'Peşinat',
                installmentNumber: 1
            });

            // Taksit ödemeleri
            const remainingAmount = totalAmount - parseFloat(downPayment);
            const monthlyAmount = remainingAmount / installmentCount;

            for (let i = 1; i <= installmentCount; i++) {
                const paymentDate = new Date(baseDate);
                paymentDate.setMonth(paymentDate.getMonth() + i);
                
                payments.push({
                    id: i,
                    amount: monthlyAmount,
                    dueDate: paymentDate.toISOString().split('T')[0],
                    description: `${i}. Taksit`,
                    installmentNumber: i + 1
                });
            }
        } else if (paymentType === 'installment' && installmentCount) {
            // Sadece taksit ödemeleri
            const monthlyAmount = totalAmount / installmentCount;

            for (let i = 1; i <= installmentCount; i++) {
                const paymentDate = new Date(baseDate);
                paymentDate.setMonth(paymentDate.getMonth() + (i - 1));
                
                payments.push({
                    id: i - 1,
                    amount: monthlyAmount,
                    dueDate: paymentDate.toISOString().split('T')[0],
                    description: `${i}. Taksit`,
                    installmentNumber: i
                });
            }
        } else if (paymentType === 'balloon-payment' && installmentCount) {
            // Balon ödeme planı
            const regularAmount = totalAmount / installmentCount;

            for (let i = 1; i < installmentCount; i++) {
                const paymentDate = new Date(baseDate);
                paymentDate.setMonth(paymentDate.getMonth() + (i - 1));
                
                payments.push({
                    id: i - 1,
                    amount: regularAmount,
                    dueDate: paymentDate.toISOString().split('T')[0],
                    description: `${i}. Taksit`,
                    installmentNumber: i
                });
            }

            // Balon ödeme (son ödeme)
            const finalPaymentDate = new Date(baseDate);
            finalPaymentDate.setMonth(finalPaymentDate.getMonth() + (installmentCount - 1));
            
            const balloonAmount = totalAmount - (regularAmount * (installmentCount - 1));
            payments.push({
                id: installmentCount - 1,
                amount: balloonAmount,
                dueDate: finalPaymentDate.toISOString().split('T')[0],
                description: 'Balon Ödeme',
                installmentNumber: installmentCount
            });
        }

        setCalculatedPayments(payments);
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
                
                // Include the payment plan
                payments: calculatedPayments.map(payment => ({
                    amount: payment.amount,
                    dueDate: payment.dueDate,
                    description: payment.description,
                    installmentNumber: payment.installmentNumber,
                    status: 'pending'
                })),
                
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

    // Table columns for payment plan
    const paymentColumns = [
        {
            title: 'Taksit',
            dataIndex: 'installmentNumber',
            key: 'installmentNumber',
            width: 80,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Tutar',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `₺${parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
        },
        {
            title: 'Vade Tarihi',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date) => new Date(date).toLocaleDateString('tr-TR'),
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

                        {/* Payment Plan Settings */}
                        <Card title="Ödeme Planı Ayarları" className="mb-6">
                            <Form layout="vertical">
                                <Form.Item label="Ödeme Türü">
                                    <Select 
                                        value={paymentPlan.paymentType} 
                                        onChange={(value) => setPaymentPlan(prev => ({ ...prev, paymentType: value }))}
                                        size="large"
                                    >
                                        <Option value="cash">Peşin</Option>
                                        <Option value="cash-installment">Peşinat + Taksit</Option>
                                        <Option value="installment">Sadece Taksit</Option>
                                        <Option value="balloon-payment">Balon Ödeme</Option>
                                    </Select>
                                </Form.Item>

                                {paymentPlan.paymentType === 'cash-installment' && (
                                    <Form.Item label="Peşinat Tutarı">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            size="large"
                                            min={0}
                                            max={totalAmount}
                                            formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/₺\s?|(,*)/g, '')}
                                            value={paymentPlan.downPayment}
                                            onChange={(value) => setPaymentPlan(prev => ({ ...prev, downPayment: value }))}
                                        />
                                    </Form.Item>
                                )}

                                {(paymentPlan.paymentType === 'cash-installment' || 
                                  paymentPlan.paymentType === 'installment' || 
                                  paymentPlan.paymentType === 'balloon-payment') && (
                                    <Form.Item label="Taksit Sayısı">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            size="large"
                                            min={1}
                                            max={60}
                                            value={paymentPlan.installmentCount}
                                            onChange={(value) => setPaymentPlan(prev => ({ ...prev, installmentCount: value }))}
                                        />
                                    </Form.Item>
                                )}

                                <Form.Item label="İlk Ödeme Tarihi">
                                    <Input
                                        type="date"
                                        size="large"
                                        value={paymentPlan.firstPaymentDate}
                                        onChange={(e) => setPaymentPlan(prev => ({ ...prev, firstPaymentDate: e.target.value }))}
                                    />
                                </Form.Item>
                            </Form>
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