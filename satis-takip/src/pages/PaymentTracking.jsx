import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Row, Col, Card, Table, Button, Form, Input, 
    Select, message, Tag, Modal, Space, Drawer, Typography,
    Spin, Alert, Statistic 
} from 'antd';
import { 
    DollarOutlined, CalendarOutlined, 
    CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
    PrinterOutlined, MessageOutlined, FileOutlined
} from '@ant-design/icons';
import axios from 'axios';
import PaymentReceipt from '../components/PaymentReceipt';
import CustomerCommunication from '../components/CustomerCommunication';
import ReportGenerator from '../components/ReportGenerator';

const { Option } = Select;
const { Title, Text } = Typography;

// Ödeme durumu yardımcı fonksiyonları
const getPaymentStatusText = (status) => {
    const statusTexts = {
        paid: 'Ödendi',
        partial: 'Kısmi Ödeme',
        pending: 'Ödenmedi',
        overdue: 'Gecikmiş',
        overpaid: 'Fazla Ödeme'
    };
    return statusTexts[status] || 'Ödenmedi';
};

const getPaymentStatusColor = (status) => {
    const statusColors = {
        paid: '#52c41a',
        partial: '#1890ff',
        pending: '#faad14',
        overdue: '#f5222d',
        overpaid: '#52c41a'
    };
    return statusColors[status] || '#faad14';
};

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0';
    return amount.toLocaleString('tr-TR');
};

const PaymentTracking = () => {
    const { saleId } = useParams();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [form] = Form.useForm();
    const paymentFormRef = useRef(null);
    const [receiptVisible, setReceiptVisible] = useState(false);
    const [communicationVisible, setCommunicationVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [reportVisible, setReportVisible] = useState(false);
    const [saleDetails, setSaleDetails] = useState(null);

    useEffect(() => {
        fetchPaymentDetails();
    }, [saleId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            
            // Önce satış detaylarını al
            const saleResponse = await axios.get(`/api/sales/${saleId}`);
            const saleData = saleResponse.data;
            console.log('Raw sale data:', saleData);
            console.log('Customer object:', JSON.stringify(saleData.customer, null, 2));
            console.log('Block object:', JSON.stringify(saleData.block, null, 2));
            console.log('Unit object:', JSON.stringify(saleData.unit, null, 2));

            // Satış verilerini state'e kaydet
            if (saleData) {
                // Müşteri bilgilerini doğru şekilde al
                const customerData = saleData.customer || {};
                const blockData = saleData.block || {};
                const unitData = saleData.unit || {};

                console.log('Customer data:', customerData);
                console.log('Block data:', blockData);
                console.log('Unit data:', unitData);

                setSaleDetails({
                    ...saleData,
                    customer: customerData,
                    block: blockData,
                    unit: unitData
                });
            }

            // Sonra ödeme detaylarını al
            const response = await axios.get(`/api/payments/${saleId}`);
            const paymentData = response.data;
            console.log('Payment data:', paymentData);
            
            setPaymentDetails(paymentData);
        } catch (error) {
            console.error('Payment details error:', error);
            setError(error.response?.data?.message || 'Bir hata oluştu');
            message.error('Ödeme detayları yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '';

        // Convert to string and handle decimal places
        let numStr = typeof value === 'number' ? value.toString() : value;
        
        // Remove existing formatting
        numStr = numStr.replace(/[^\d,]/g, '');
        
        // Split by comma and take only first two parts
        const parts = numStr.split(',');
        let integerPart = parts[0];
        let decimalPart = parts[1] || '';

        // Add thousand separators to integer part
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        // Limit decimal places to 2
        decimalPart = decimalPart.slice(0, 2);
        
        // Combine parts
        return `${integerPart}${decimalPart ? ',' + decimalPart : ''}`;
    };

    const handleAmountChange = (e) => {
        const formattedValue = formatCurrency(e.target.value);
        form.setFieldsValue({ paidAmount: formattedValue });
    };

    const calculatePaymentStatus = (payment) => {
        const paid = payment.paidAmount || 0;
        const total = payment.amount || 0;
        const remaining = total - paid;
        const dueDate = new Date(payment.dueDate);
        const today = new Date();

        if (Math.abs(remaining) < 0.01) { // Tam ödeme (küçük yuvarlama farkları için tolerans)
            return 'paid';
        } else if (remaining < 0) { // Fazla ödeme
            return 'overpaid';
        } else if (paid > 0) { // Kısmi ödeme
            return dueDate < today ? 'overdue' : 'partial';
        } else { // Hiç ödeme yapılmamış
            return dueDate < today ? 'overdue' : 'pending';
        }
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            paid: { color: 'success', text: 'Ödendi', icon: <CheckCircleOutlined /> },
            partial: { color: 'processing', text: 'Kısmi Ödeme', icon: <ClockCircleOutlined /> },
            overdue: { color: 'error', text: 'Gecikmiş', icon: <ClockCircleOutlined /> },
            pending: { color: 'warning', text: 'Bekliyor', icon: <ClockCircleOutlined /> },
            overpaid: { color: 'error', text: 'Fazla Ödeme', icon: <WarningOutlined /> }
        };

        const config = statusConfig[status] || { color: 'default', text: 'Belirsiz', icon: null };
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
    };

    const handlePaymentSubmit = async (values) => {
        if (!selectedPayment) return;

        try {
            // Convert formatted number to decimal
            const numStr = values.paidAmount.replace(/\./g, '').replace(',', '.');
            const paidAmount = parseFloat(numStr);

            if (isNaN(paidAmount)) {
                message.error('Geçerli bir tutar giriniz');
                return;
            }

            if (paidAmount <= 0) {
                message.error('Ödeme tutarı 0\'dan büyük olmalıdır');
                return;
            }

            // Taksit tutarını kontrol et
            const remainingAmount = selectedPayment.amount - (selectedPayment.paidAmount || 0);
            if (paidAmount > remainingAmount) {
                message.error('Kalan tutardan fazla ödeme yapılamaz');
                return;
            }

            await axios.post(`/api/payments/${saleId}`, {
                paymentId: selectedPayment.id,
                paidAmount: paidAmount,
                paymentMethod: values.paymentMethod,
                notes: values.notes || undefined,
                paidDate: new Date()
            });
            
            message.success('Ödeme başarıyla kaydedildi');
            setReceiptVisible(true); // Ödeme makbuzunu göster
            form.resetFields();
            setSelectedPayment(null);
            fetchPaymentDetails();
        } catch (error) {
            message.error(error.response?.data?.message || 'Ödeme kaydedilirken bir hata oluştu');
        }
    };

    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '0,000 TL';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const columns = [
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            render: (text, record) => (
                <Space direction="vertical" size="small">
                    <Text>{text}</Text>
                    <Text type="secondary">
                        {record.isAdvancePayment ? 
                            'Peşinat' : 
                            `Taksit ${record.installmentNumber - 1} / ${paymentDetails.payments.length - 1}`
                        }
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Vade Tarihi',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (date) => new Date(date).toLocaleDateString('tr-TR'),
        },
        {
            title: 'Tutar',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => formatAmount(amount),
        },
        {
            title: 'Ödenen',
            dataIndex: 'paidAmount',
            key: 'paidAmount',
            render: (amount) => formatAmount(amount || 0),
        },
        {
            title: 'Kalan',
            dataIndex: 'remainingAmount',
            key: 'remainingAmount',
            render: (_, record) => {
                const remaining = record.amount - (record.paidAmount || 0);
                return formatAmount(remaining);
            },
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => getStatusTag(calculatePaymentStatus(record)),
        },
        {
            title: 'İşlem',
            key: 'action',
            render: (_, record) => {
                const status = calculatePaymentStatus(record);
                return (
                    <Space>
                        {status !== 'paid' && status !== 'overpaid' && (
                            <Button 
                                type="primary"
                                onClick={() => {
                                    setSelectedPayment(record);
                                    const remaining = record.amount - (record.paidAmount || 0);
                                    const formattedAmount = formatCurrency(remaining.toString().replace('.', ','));
                                    form.setFieldsValue({
                                        paidAmount: formattedAmount,
                                        paymentMethod: 'cash',
                                        notes: ''
                                    });
                                    setTimeout(() => {
                                        paymentFormRef.current?.scrollIntoView({ 
                                            behavior: 'smooth',
                                            block: 'start',
                                            inline: 'nearest'
                                        });
                                    }, 200);
                                }}
                            >
                                Ödeme Al
                            </Button>
                        )}
                        <Button 
                            icon={<PrinterOutlined />}
                            onClick={() => {
                                const paymentData = {
                                    ...record,
                                    paymentDate: record.paymentDate || new Date().toISOString(),
                                    customerName: saleDetails?.customer?.name || '-',
                                    projectName: saleDetails?.project?.name || '-',
                                    unitNumber: saleDetails?.unit?.number || '-',
                                    paidAmount: parseFloat(record.paidAmount) || 0
                                };

                                console.log('Payment data for receipt:', paymentData);
                                setSelectedPayment(paymentData);
                                setReceiptVisible(true);
                            }}
                        >
                            Makbuz
                        </Button>
                        <Button 
                            icon={<MessageOutlined />}
                            onClick={() => {
                                setSelectedCustomer(record.customer);
                                setCommunicationVisible(true);
                            }}
                        >
                            İletişim
                        </Button>
                    </Space>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Hata"
                description={error}
                type="error"
                showIcon
                style={{ maxWidth: 600, margin: '50px auto' }}
            />
        );
    }

    return (
        <div>
            {/* Müşteri Bilgileri Başlığı */}
            {saleDetails && (
                <Card
                    style={{ marginBottom: 24, background: '#f5f5f5' }}
                    bordered={false}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Müşteri Adı"
                                value={saleDetails?.customer ? `${saleDetails.customer.firstName} ${saleDetails.customer.lastName}` : '-'}
                                valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Daire No"
                                value={saleDetails?.block?.unitNumber || '-'}
                                valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Statistic
                                title="Toplam Tutar"
                                value={formatCurrency(paymentDetails?.totalAmount)}
                                prefix="₺"
                                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                            />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Statistic
                                title="Ödenen Tutar"
                                value={formatCurrency(paymentDetails?.totalPaidAmount)}
                                prefix="₺"
                                valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Statistic
                                title="Kalan Tutar"
                                value={formatCurrency(paymentDetails?.remainingAmount)}
                                prefix="₺"
                                valueStyle={{ 
                                    fontSize: '16px', 
                                    color: paymentDetails?.remainingAmount > 0 ? '#f5222d' : '#52c41a'
                                }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Statistic
                                title="Ödeme Durumu"
                                value={getPaymentStatusText(paymentDetails?.paymentStatus)}
                                valueStyle={{ 
                                    fontSize: '16px',
                                    color: getPaymentStatusColor(paymentDetails?.paymentStatus)
                                }}
                            />
                        </Col>
                    </Row>
                </Card>
            )}

            <Row gutter={[16, 24]}>
                <Col span={24}>
                    <Space style={{ marginBottom: 16 }}>
                        <Button 
                            type="primary" 
                            icon={<FileOutlined />}
                            onClick={() => setReportVisible(true)}
                        >
                            Rapor Oluştur
                        </Button>
                    </Space>
                </Col>

                <Col span={24}>
                    <Card>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Statistic
                                    title="Toplam Tutar"
                                    value={paymentDetails?.totalAmount}
                                    formatter={(value) => formatAmount(value)}
                                    prefix={<DollarOutlined />}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Ödenen Tutar"
                                    value={paymentDetails?.totalPaidAmount}
                                    formatter={(value) => formatAmount(value)}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                            <Col span={8}>
                                <Statistic
                                    title="Kalan Tutar"
                                    value={paymentDetails?.remainingAmount}
                                    formatter={(value) => formatAmount(value)}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Ödeme Planı">
                        <Table
                            columns={columns}
                            dataSource={paymentDetails?.payments}
                            rowKey="id"
                            pagination={false}
                        />
                    </Card>
                </Col>

                {selectedPayment && (
                    <Col span={24} ref={paymentFormRef}>
                        <Card title="Ödeme Yap">
                            <Form
                                form={form}
                                onFinish={handlePaymentSubmit}
                                layout="vertical"
                            >
                                <Form.Item
                                    name="paidAmount"
                                    label="Ödeme Tutarı"
                                    rules={[
                                        { required: true, message: 'Lütfen ödeme tutarını giriniz' },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();
                                                
                                                const numStr = value.replace(/\./g, '').replace(',', '.');
                                                const amount = parseFloat(numStr);

                                                if (isNaN(amount) || amount <= 0) {
                                                    return Promise.reject('Geçerli bir tutar giriniz');
                                                }
                                                if (amount > selectedPayment.remainingAmount) {
                                                    return Promise.reject('Kalan tutardan fazla ödeme yapılamaz');
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <Input
                                        onChange={handleAmountChange}
                                        placeholder="0,00"
                                        suffix="₺"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="paymentMethod"
                                    label="Ödeme Yöntemi"
                                    rules={[{ required: true, message: 'Lütfen ödeme yöntemini seçiniz' }]}
                                >
                                    <Select>
                                        <Option value="cash">Nakit</Option>
                                        <Option value="credit_card">Kredi Kartı</Option>
                                        <Option value="bank_transfer">Havale/EFT</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="notes"
                                    label="Notlar"
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Ödemeyi Kaydet
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Ödeme Makbuzu Modal */}
            {selectedPayment && (
                <PaymentReceipt
                    payment={{
                        ...selectedPayment,
                        customerName: selectedPayment.customer?.name || selectedPayment.customerName || selectedPayment.customer?.customerName,
                        projectName: selectedPayment.project?.name || selectedPayment.projectName || selectedPayment.project?.projectName,
                        unitNumber: selectedPayment.unit?.number || selectedPayment.unitNumber || selectedPayment.unit?.unitNumber,
                        paymentDate: selectedPayment.paymentDate || new Date().toISOString(),
                        paidAmount: parseFloat(selectedPayment.paidAmount) || 0
                    }}
                    visible={receiptVisible}
                    onClose={() => setReceiptVisible(false)}
                />
            )}

            {/* Müşteri İletişim Drawer */}
            {selectedCustomer && (
                <Drawer
                    title="Müşteri İletişim"
                    width={720}
                    open={communicationVisible}
                    onClose={() => setCommunicationVisible(false)}
                >
                    <CustomerCommunication
                        customerId={selectedCustomer.id}
                        customerName={selectedCustomer.name}
                    />
                </Drawer>
            )}

            {/* Rapor Modal */}
            <Modal
                title="Rapor Oluştur"
                open={reportVisible}
                onCancel={() => setReportVisible(false)}
                footer={null}
                width={800}
            >
                <ReportGenerator />
            </Modal>
        </div>
    );
};

export default PaymentTracking;
