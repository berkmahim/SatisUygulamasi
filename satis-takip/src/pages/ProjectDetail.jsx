import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Typography, Card, Table, Input, Select, Space, Button, Tag, Row, Col, 
    Statistic, Spin, Alert, Modal, message, Checkbox, InputNumber, Form, DatePicker
} from 'antd';
import { 
    SearchOutlined, DollarOutlined, FileTextOutlined, 
    StopOutlined, BoxPlotOutlined, BarChartOutlined,
    PieChartOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const BASE_URL = import.meta.env.VITE_API_URL;
const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [sales, setSales] = useState([]);
    const [cancelledSales, setCancelledSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [hasRefund, setHasRefund] = useState(false);
    const [refundForm] = Form.useForm();
    const [activeTabKey, setActiveTabKey] = useState('active');
    const [loadingCancelled, setLoadingCancelled] = useState(false);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const [projectResponse, salesResponse] = await Promise.all([
                axios.get(`${BASE_URL}/api/projects/${id}`),
                axios.get(`${BASE_URL}/api/sales/project/${id}?status=active`)
            ]);

            setProject(projectResponse.data);
            setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
        } catch (error) {
            setError(error.response?.data?.message || 'Bir hata oluştu');
            message.error('Proje detayları yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // İptal edilmiş satışları getir
    const fetchCancelledSales = async () => {
        try {
            setLoadingCancelled(true);
            const response = await axios.get(`${BASE_URL}/api/sales/project/${id}?status=cancelled`);
            setCancelledSales(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            message.error('İptal edilmiş satışlar yüklenirken bir hata oluştu');
        } finally {
            setLoadingCancelled(false);
        }
    };

    useEffect(() => {
        if (activeTabKey === 'cancelled') {
            fetchCancelledSales();
        }
    }, [activeTabKey, id]);

    const handlePaymentClick = (saleId) => {
        navigate(`/sales/${saleId}/payments`);
    };

    const handleCancelSale = (sale) => {
        setSelectedSale(sale);
        setShowCancelModal(true);
        setHasRefund(false);
        
        // Müşterinin toplam ödediği tutarı hesapla
        const totalPaidAmount = calculateTotalPaidAmount(sale);
        
        // Form alanlarını sıfırla ve iade miktarını ödenen tutar olarak ayarla
        refundForm.resetFields();
        refundForm.setFieldsValue({
            refundAmount: totalPaidAmount,
            refundDate: null,
            refundReason: ''
        });
    };
    
    // Müşterinin toplam ödediği tutarı hesaplayan yardımcı fonksiyon
    const calculateTotalPaidAmount = (sale) => {
        if (!sale || !sale.payments) return 0;
        
        return sale.payments.reduce((total, payment) => {
            return total + (payment.paidAmount || 0);
        }, 0);
    };

    const processCancelSale = async () => {
        try {
            setCancelLoading(true);
            
            let values = {};
            if (hasRefund) {
                // Eğer iade varsa form değerlerini al
                values = await refundForm.validateFields();
            }
            
            const payload = {
                hasRefund: hasRefund,
                ...values
            };
            
            const response = await axios.post(`${BASE_URL}/api/sales/${selectedSale._id}/cancel`, payload);
            
            // İptal edilen satışı listeden kaldır
            setSales(sales.filter(sale => sale._id !== selectedSale._id));
            
            message.success('Satış başarıyla iptal edildi');
            
            // Blok durumunu güncellenmiş olarak göstermek için projeyi yeniden yükle
            fetchProjectDetails();
            
            setShowCancelModal(false);
        } catch (error) {
            console.error('Satış iptal hatası:', error);
            message.error(error.response?.data?.message || 'Satış iptal edilirken bir hata oluştu');
        } finally {
            setCancelLoading(false);
        }
    };

    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            paid: { color: 'success', text: 'Ödendi' },
            partial: { color: 'processing', text: 'Kısmi Ödeme' },
            overdue: { color: 'error', text: 'Gecikmiş' },
            pending: { color: 'warning', text: 'Bekliyor' },
            default: { color: 'default', text: 'Belirsiz' }
        };

        const config = statusConfig[status] || statusConfig.default;
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: 'Birim(ler)',
            key: 'units',
            render: (_, record) => {
                if (record.isBulkSale) {
                    return (
                        <div>
                            <strong style={{ color: '#1890ff' }}>
                                Toplu Satış ({record.bulkSaleBlocks?.length || 0} birim)
                            </strong>
                            <br />
                            <small style={{ color: '#666' }}>
                                ID: {record.bulkSaleId?.slice(-8)}
                            </small>
                        </div>
                    );
                } else {
                    return record.blockId?.unitNumber || 'N/A';
                }
            },
            sorter: (a, b) => {
                if (a.isBulkSale && b.isBulkSale) {
                    return (a.bulkSaleBlocks?.length || 0) - (b.bulkSaleBlocks?.length || 0);
                }
                if (a.isBulkSale) return 1;
                if (b.isBulkSale) return -1;
                return (a.blockId?.unitNumber || '').localeCompare(b.blockId?.unitNumber || '');
            },
        },
        {
            title: 'Müşteri',
            dataIndex: ['customerId'],
            key: 'customer',
            render: (customer) => `${customer.firstName} ${customer.lastName}`,
            sorter: (a, b) => a.customerId.firstName.localeCompare(b.customerId.firstName),
        },
        {
            title: 'Toplam Tutar',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount),
            sorter: (a, b) => a.totalAmount - b.totalAmount,
        },
        {
            title: 'Ödeme Durumu',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status) => getPaymentStatusTag(status),
            filters: [
                { text: 'Ödendi', value: 'paid' },
                { text: 'Kısmi Ödeme', value: 'partial' },
                { text: 'Gecikmiş', value: 'overdue' },
                { text: 'Bekliyor', value: 'pending' },
            ],
            onFilter: (value, record) => record.paymentStatus === value,
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<DollarOutlined />} 
                        onClick={() => handlePaymentClick(record._id)}
                    >
                        Ödemeler
                    </Button>
                    <Button 
                        type="default" 
                        danger 
                        icon={<StopOutlined />}
                        onClick={() => handleCancelSale(record)}
                    >
                        İptal
                    </Button>
                </Space>
            ),
        },
    ];

    // İptal edilmiş satışlar için sütunlar
    const cancelledColumns = [
        {
            title: 'Blok/Daire',
            dataIndex: ['blockId', 'unitNumber'],
            key: 'unitNumber',
            sorter: (a, b) => a.blockId.unitNumber.localeCompare(b.blockId.unitNumber),
        },
        {
            title: 'Müşteri',
            dataIndex: ['customerId'],
            key: 'customer',
            render: (customer) => `${customer.firstName} ${customer.lastName}`,
            sorter: (a, b) => a.customerId.firstName.localeCompare(b.customerId.firstName),
        },
        {
            title: 'İptal Tarihi',
            dataIndex: ['cancellationDetails', 'cancelledAt'],
            key: 'cancelledAt',
            render: (date) => new Date(date).toLocaleDateString('tr-TR'),
            sorter: (a, b) => new Date(a.cancellationDetails.cancelledAt) - new Date(b.cancellationDetails.cancelledAt),
        },
        {
            title: 'İade Durumu',
            key: 'refundStatus',
            render: (_, record) => (
                <Tag color={record.cancellationDetails.hasRefund ? 'green' : 'orange'}>
                    {record.cancellationDetails.hasRefund ? 'İade Edildi' : 'İade Edilmedi'}
                </Tag>
            ),
            filters: [
                { text: 'İade Edildi', value: true },
                { text: 'İade Edilmedi', value: false },
            ],
            onFilter: (value, record) => record.cancellationDetails.hasRefund === value,
        },
        {
            title: 'İade Tutarı',
            dataIndex: ['cancellationDetails', 'refundAmount'],
            key: 'refundAmount',
            render: (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0),
        },
        {
            title: 'İptal Nedeni',
            dataIndex: ['cancellationDetails', 'reason'],
            key: 'reason',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button 
                        type={record.cancellationDetails.hasRefund ? "default" : "primary"}
                        onClick={() => handleUpdateRefundStatus(record)}
                        disabled={record.cancellationDetails.hasRefund}
                    >
                        {record.cancellationDetails.hasRefund ? 'İade Edildi' : 'İade Durumunu Güncelle'}
                    </Button>
                </Space>
            ),
        },
    ];

    // İade durumunu güncelleme
    const handleUpdateRefundStatus = async (sale) => {
        Modal.confirm({
            title: 'İade Durumunu Güncelle',
            content: 'Bu satış için iade yapıldığını onaylıyor musunuz?',
            okText: 'Evet, İade Yapıldı',
            cancelText: 'İptal',
            onOk: async () => {
                try {
                    await axios.put(`${BASE_URL}/api/sales/${sale._id}/update-refund`, {
                        hasRefund: true,
                        refundDate: new Date()
                    });
                    
                    message.success('İade durumu güncellendi');
                    fetchCancelledSales();
                } catch (error) {
                    message.error('İade durumu güncellenirken bir hata oluştu');
                }
            },
        });
    };

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
                        <Title level={2}>{project?.name}</Title>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Text>Konum: {project?.location}</Text>
                            <Text>Açıklama: {project?.description}</Text>
                        </Space>
                        <Space>
                            <Button
                                type="primary"
                                icon={<BarChartOutlined />}
                                onClick={() => navigate(`/projects/${id}/reports`)}
                            >
                                Raporlar
                            </Button>
                        </Space>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card
                        title="Satışlar"
                        tabList={[
                            {
                                key: 'active',
                                tab: 'Aktif Satışlar',
                            },
                            {
                                key: 'cancelled',
                                tab: 'İptal Edilen Satışlar',
                            },
                        ]}
                        activeTabKey={activeTabKey}
                        onTabChange={setActiveTabKey}
                    >
                        {activeTabKey === 'active' && (
                            <>
                                <Space style={{ marginBottom: 16 }} size="middle">
                                    <Search
                                        placeholder="Ara..."
                                        allowClear
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                    <Link to={`/projects/${id}/building`}>
                                        <Button type="primary" icon={<BoxPlotOutlined />}>
                                            3D Görünüm
                                        </Button>
                                    </Link>
                                </Space>

                                <Table
                                    columns={columns}
                                    dataSource={sales.filter(sale => {
                                        const searchLower = searchTerm.toLowerCase();
                                        const customerName = `${sale.customerId.firstName} ${sale.customerId.lastName}`.toLowerCase();
                                        
                                        if (sale.isBulkSale) {
                                            // For bulk sales, also search in bulk sale ID
                                            const bulkSaleId = (sale.bulkSaleId || '').toLowerCase();
                                            return customerName.includes(searchLower) || 
                                                   bulkSaleId.includes(searchLower) ||
                                                   'toplu'.includes(searchLower);
                                        } else {
                                            // For individual sales, search in unit number
                                            const unitInfo = (sale.blockId?.unitNumber || '').toLowerCase();
                                            return customerName.includes(searchLower) || 
                                                   unitInfo.includes(searchLower);
                                        }
                                    })}
                                    rowKey="_id"
                                    pagination={{ pageSize: 10 }}
                                    loading={loading}
                                />
                            </>
                        )}

                        {activeTabKey === 'cancelled' && (
                            <Table
                                columns={cancelledColumns}
                                dataSource={cancelledSales}
                                rowKey="_id"
                                pagination={{ pageSize: 10 }}
                                loading={loadingCancelled}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Satış İptali"
                open={showCancelModal}
                onCancel={() => setShowCancelModal(false)}
                footer={[
                    <Button key="back" onClick={() => setShowCancelModal(false)}>
                        Vazgeç
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        danger 
                        loading={cancelLoading}
                        onClick={processCancelSale}
                    >
                        Satışı İptal Et
                    </Button>,
                ]}
            >
                {selectedSale && (
                    <div>
                        <p>Bu satışı iptal etmek istediğinizden emin misiniz?</p>
                        <div style={{ marginBottom: 16 }}>
                            <p><strong>Blok/Daire:</strong> {selectedSale.blockId.unitNumber}</p>
                            <p><strong>Müşteri:</strong> {selectedSale.customerId.firstName} {selectedSale.customerId.lastName}</p>
                            <p><strong>Toplam Tutar:</strong> {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedSale.totalAmount)}</p>
                        </div>
                        
                        <Checkbox 
                            checked={hasRefund} 
                            onChange={(e) => {
                                setHasRefund(e.target.checked);
                                
                                // Eğer checkbox seçiliyse, ödenen tutarı form alanına doldur
                                if (e.target.checked && selectedSale) {
                                    const totalPaidAmount = calculateTotalPaidAmount(selectedSale);
                                    refundForm.setFieldsValue({
                                        refundAmount: totalPaidAmount
                                    });
                                }
                            }}
                            style={{ marginBottom: 16 }}
                        >
                            Müşteriye geri ödeme yapılacak
                        </Checkbox>
                        
                        {hasRefund && (
                            <Form 
                                form={refundForm}
                                layout="vertical"
                                initialValues={{
                                    refundDate: null,
                                    refundAmount: 0,
                                    refundReason: ''
                                }}
                            >
                                <Form.Item
                                    name="refundAmount"
                                    label="İade Miktarı (₺)"
                                    rules={[
                                        { required: true, message: 'Lütfen iade miktarını giriniz' },
                                        { 
                                            validator: (_, value) => {
                                                const totalPaidAmount = calculateTotalPaidAmount(selectedSale);
                                                if (value > totalPaidAmount) {
                                                    return Promise.reject(`İade miktarı ödenen toplam tutardan (${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalPaidAmount)}) fazla olamaz`);
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <InputNumber 
                                        min={0} 
                                        max={selectedSale.totalAmount}
                                        style={{ width: '100%' }} 
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\$\s?|(\.*)/g, '')}
                                    />
                                </Form.Item>
                                
                                <Form.Item
                                    name="refundDate"
                                    label="İade Tarihi"
                                    rules={[{ required: true, message: 'Lütfen iade tarihini giriniz' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                                </Form.Item>
                                
                                <Form.Item
                                    name="refundReason"
                                    label="İptal Nedeni"
                                    rules={[{ required: true, message: 'Lütfen iptal nedenini giriniz' }]}
                                >
                                    <Input.TextArea rows={3} />
                                </Form.Item>
                            </Form>
                        )}
                        
                        <Alert 
                            type="warning" 
                            message="Uyarı" 
                            description="Satış iptal edildiğinde ilgili birim tekrar satılabilir duruma geçecektir. Bu işlem geri alınamaz." 
                            showIcon
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProjectDetail;
