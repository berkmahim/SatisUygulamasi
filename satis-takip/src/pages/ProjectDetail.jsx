import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Typography, Card, Table, Input, Select, Space, Button, Tag, Row, Col, 
    Statistic, Spin, Alert, Modal, message 
} from 'antd';
import { 
    SearchOutlined, DollarOutlined, FileTextOutlined, 
    StopOutlined, BoxPlotOutlined, BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const [projectResponse, salesResponse] = await Promise.all([
                axios.get(`/api/projects/${id}`),
                axios.get(`/api/sales/project/${id}`)
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

    const handlePaymentClick = (saleId) => {
        navigate(`/sales/${saleId}/payments`);
    };

    const handleCancelSale = (sale) => {
        setSelectedSale(sale);
        setShowCancelModal(true);
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
            title: 'Blok/Daire',
            dataIndex: ['block', 'unitNumber'],
            key: 'unitNumber',
            sorter: (a, b) => a.block.unitNumber.localeCompare(b.block.unitNumber),
        },
        {
            title: 'Müşteri',
            dataIndex: ['customer'],
            key: 'customer',
            render: (customer) => `${customer.firstName} ${customer.lastName}`,
            sorter: (a, b) => a.customer.firstName.localeCompare(b.customer.firstName),
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
                                onClick={() => navigate(`/reports/projects/${id}`)}
                            >
                                Raporlar
                            </Button>
                        </Space>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Satışlar">
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
                                const customerName = `${sale.customer.firstName} ${sale.customer.lastName}`.toLowerCase();
                                const unitInfo = sale.block.unitNumber.toLowerCase();
                                
                                return customerName.includes(searchLower) || 
                                       unitInfo.includes(searchLower);
                            })}
                            rowKey="_id"
                            pagination={{ pageSize: 10 }}
                            onChange={(pagination, filters, sorter) => {
                                console.log('Table params:', { pagination, filters, sorter });
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title="Satış İptali"
                open={showCancelModal}
                onCancel={() => setShowCancelModal(false)}
                footer={[
                    <Button key="back" onClick={() => setShowCancelModal(false)}>
                        İptal
                    </Button>,
                    <Button key="submit" type="primary" danger onClick={() => {
                        // Satış iptal işlemi
                        setShowCancelModal(false);
                    }}>
                        Satışı İptal Et
                    </Button>,
                ]}
            >
                <p>Bu satışı iptal etmek istediğinizden emin misiniz?</p>
                {selectedSale && (
                    <div>
                        <p>Blok/Daire: {selectedSale.block.unitNumber}</p>
                        <p>Müşteri: {selectedSale.customer.firstName} {selectedSale.customer.lastName}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProjectDetail;
