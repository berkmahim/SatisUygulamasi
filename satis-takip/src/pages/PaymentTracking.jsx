import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Card, Table, Form, Input, Select, Button, Tag, Space, 
    Typography, Spin, Alert, Row, Col, Statistic, message 
} from 'antd';
import { 
    DollarOutlined, CalendarOutlined, 
    CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const PaymentTracking = () => {
    const { saleId } = useParams();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [form] = Form.useForm();
    const paymentFormRef = useRef(null);

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
            message.error('Ödeme detayları yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (values) => {
        if (!selectedPayment) return;

        try {
            await axios.post(`/api/payments/${saleId}`, {
                paymentId: selectedPayment.id,
                paidAmount: parseFloat(values.paidAmount.replace(/[.,]/g, '')),
                paymentMethod: values.paymentMethod,
                notes: values.notes || undefined,
                paidDate: new Date()
            });
            
            message.success('Ödeme başarıyla kaydedildi');
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

    const getStatusTag = (status) => {
        const statusConfig = {
            paid: { color: 'success', text: 'Ödendi', icon: <CheckCircleOutlined /> },
            partial: { color: 'processing', text: 'Kısmi Ödeme', icon: <ClockCircleOutlined /> },
            overdue: { color: 'error', text: 'Gecikmiş', icon: <ClockCircleOutlined /> },
            pending: { color: 'warning', text: 'Bekliyor', icon: <ClockCircleOutlined /> }
        };

        const config = statusConfig[status] || { color: 'default', text: 'Belirsiz', icon: null };
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
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
            render: (amount) => formatAmount(amount),
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
        },
        {
            title: 'İşlem',
            key: 'action',
            render: (_, record) => (
                record.status !== 'paid' && (
                    <Button 
                        type="primary"
                        onClick={() => {
                            setSelectedPayment(record);
                            form.setFieldsValue({
                                paidAmount: record.remainingAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
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
                )
            ),
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
            <Row gutter={[16, 24]}>
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
                                layout="vertical"
                                onFinish={handlePaymentSubmit}
                            >
                                <Form.Item
                                    name="paidAmount"
                                    label="Ödeme Tutarı"
                                    rules={[
                                        { required: true, message: 'Lütfen ödeme tutarını girin' },
                                        {
                                            validator: async (_, value) => {
                                                if (!value) return;
                                                const numericValue = parseFloat(value.replace(/[.,]/g, ''));
                                                if (numericValue > selectedPayment.remainingAmount) {
                                                    throw new Error('Kalan tutardan fazla ödeme yapılamaz');
                                                }
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            value = value.replace(/[^0-9,]/g, '');
                                            value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                                            form.setFieldsValue({ paidAmount: value });
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="paymentMethod"
                                    label="Ödeme Yöntemi"
                                    rules={[{ required: true, message: 'Lütfen ödeme yöntemini seçin' }]}
                                    initialValue="cash"
                                >
                                    <Select>
                                        <Option value="cash">Nakit</Option>
                                        <Option value="bank_transfer">Havale/EFT</Option>
                                        <Option value="credit_card">Kredi Kartı</Option>
                                        <Option value="check">Çek</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="notes"
                                    label="Notlar"
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>

                                <Form.Item>
                                    <Space>
                                        <Button type="primary" htmlType="submit">
                                            Ödemeyi Kaydet
                                        </Button>
                                        <Button onClick={() => {
                                            setSelectedPayment(null);
                                            form.resetFields();
                                        }}>
                                            İptal
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default PaymentTracking;
