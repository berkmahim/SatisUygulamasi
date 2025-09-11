import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Row, Col, Card, Table, Button, Form, Input, 
    Select, message, Tag, Modal, Space, Drawer, Typography,
    Spin, Alert, Statistic, InputNumber, Avatar, Divider
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
const BASE_URL = import.meta.env.VITE_API_URL;
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
            const saleResponse = await axios.get(`${BASE_URL}/api/sales/${saleId}`);
            const saleData = saleResponse.data;

            // Satış verilerini state'e kaydet
            if (saleData) {
                setSaleDetails({
                    ...saleData,
                    customer: saleData.customerId || {},
                    block: saleData.blockId || {},
                    // For bulk sales, include unit numbers from API response
                    unitNumbers: saleData.unitNumbers || (saleData.blockId?.unitNumber || '-')
                });
            }

            // Sonra ödeme detaylarını al
            const response = await axios.get(`${BASE_URL}/api/payments/${saleId}`);
            const paymentData = response.data;
            console.log('Payment data:', paymentData);
            
            setPaymentDetails(paymentData);
            
            // Update saleDetails with unit numbers from payment data if not already set
            if (paymentData.unitNumbers && saleData) {
                setSaleDetails(prev => ({
                    ...prev,
                    unitNumbers: paymentData.unitNumbers
                }));
            }
        } catch (error) {
            console.error('Payment details error:', error);
            setError(error.response?.data?.message || 'Bir hata oluştu');
            message.error('Ödeme detayları yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (values) => {
        if (!selectedPayment) return;

        try {
            // paidAmount artık doğrudan sayısal değer olarak gelecek
            const paidAmount = values.paidAmount;
            
            if (isNaN(paidAmount) || paidAmount <= 0) {
                message.error('Geçerli bir tutar giriniz');
                return;
            }

            // Taksit tutarını kontrol et
            const remainingAmount = selectedPayment.amount - (selectedPayment.paidAmount || 0);
            if (paidAmount > remainingAmount) {
                message.error('Kalan tutardan fazla ödeme yapılamaz');
                return;
            }

            await axios.post(`${BASE_URL}/api/payments/${saleId}`, {
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

    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '0,00 ₺';
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
                                    form.setFieldsValue({
                                        paidAmount: remaining,
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
                                    customerName: `${saleDetails?.customer?.firstName || ''} ${saleDetails?.customer?.lastName || ''}`.trim() || '-',
                                    projectName: saleDetails?.project?.name || '-',
                                    unitNumber: saleDetails?.block?.unitNumber || '-',
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
                        <Col xs={24} sm={12} md={6}>
                            <Statistic
                                title="Müşteri Adı"
                                value={`${saleDetails?.customer?.firstName || ''} ${saleDetails?.customer?.lastName || ''}`.trim() || '-'}
                                valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Statistic
                                title="Daire No"
                                value={saleDetails?.unitNumbers || '-'}
                                valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Statistic
                                title="Referans"
                                value={saleDetails?.block?.reference?.name || '-'}
                                valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Statistic
                                title="Toplam Tutar"
                                value={saleDetails?.totalAmount || 0}
                                formatter={(value) => formatAmount(value)}
                                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                            />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Statistic
                                title="Ödenen Tutar"
                                value={paymentDetails?.totalPaidAmount || 0}
                                formatter={(value) => formatAmount(value)}
                                valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Statistic
                                title="Kalan Tutar"
                                value={paymentDetails?.remainingAmount || 0}
                                formatter={(value) => formatAmount(value)}
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
                                        { required: true, message: 'Lütfen ödeme tutarını giriniz' }
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0.01}
                                        max={selectedPayment ? (selectedPayment.amount - (selectedPayment.paidAmount || 0)) : 999999999}
                                        precision={2}
                                        formatter={(value) => {
                                            return value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
                                        }}
                                        parser={(value) => {
                                            if (!value) return '';
                                            // Binlik ayırıcı noktaları kaldır
                                            let parsed = value.replace(/\./g, '');
                                            // Ondalık ayırıcı virgülü, JavaScript'in anlayacağı noktaya çevir
                                            parsed = parsed.replace(',', '.');
                                            return parsed;
                                        }}
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
                        unitNumber: paymentDetails?.unitNumbers || selectedPayment.unit?.number || selectedPayment.unitNumber || selectedPayment.unit?.unitNumber,
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
