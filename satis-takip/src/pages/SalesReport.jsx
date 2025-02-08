import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title as ChartTitle,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
    Card, Row, Col, Statistic, Typography, Spin, Alert, 
    Table, Space 
} from 'antd';
import { 
    DollarOutlined, CheckCircleOutlined, 
    ClockCircleOutlined, WarningOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Chart.js bileşenlerini kaydet
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    ChartTitle,
    Tooltip,
    Legend
);

const SalesReport = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [monthlySales, setMonthlySales] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState({});
    const [projectSales, setProjectSales] = useState({});

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                
                // Tüm rapor verilerini paralel olarak al
                const [
                    statsResponse,
                    monthlyResponse,
                    statusResponse,
                    projectResponse
                ] = await Promise.all([
                    axios.get('/api/reports/statistics'),
                    axios.get('/api/reports/monthly-sales'),
                    axios.get('/api/reports/payment-status'),
                    axios.get('/api/reports/project-sales')
                ]);

                setStatistics(statsResponse.data);
                setMonthlySales(monthlyResponse.data);
                setPaymentStatus(statusResponse.data);
                setProjectSales(projectResponse.data);
                
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Rapor verileri alınırken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    // Para formatı
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Aylık satış grafiği verileri
    const monthlySalesData = {
        labels: monthlySales.map(item => format(parseISO(item.month + '-01'), 'MMMM yyyy', { locale: tr })),
        datasets: [
            {
                label: 'Aylık Satış Tutarı',
                data: monthlySales.map(item => item.amount),
                borderColor: '#1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.5)',
            }
        ]
    };

    // Ödeme durumu pasta grafiği verileri
    const paymentStatusData = {
        labels: Object.keys(paymentStatus).map(status => {
            switch (status) {
                case 'paid': return 'Ödendi';
                case 'partial': return 'Kısmi Ödeme';
                case 'overdue': return 'Gecikmiş';
                case 'pending': return 'Bekliyor';
                default: return status;
            }
        }),
        datasets: [
            {
                data: Object.values(paymentStatus),
                backgroundColor: [
                    '#52c41a',  // success
                    '#1890ff',  // processing
                    '#f5222d',  // error
                    '#faad14',  // warning
                ],
                borderColor: [
                    '#52c41a',
                    '#1890ff',
                    '#f5222d',
                    '#faad14',
                ],
                borderWidth: 1,
            },
        ],
    };

    const projectColumns = [
        {
            title: 'Proje',
            dataIndex: 'name',
            key: 'name',
            responsive: ['sm'],
        },
        {
            title: 'Toplam Satış',
            dataIndex: 'totalSales',
            key: 'totalSales',
            align: 'right',
            render: value => formatCurrency(value),
            responsive: ['md'],
        },
        {
            title: 'Tahsilat',
            dataIndex: 'collected',
            key: 'collected',
            align: 'right',
            render: value => formatCurrency(value),
        },
        {
            title: 'Kalan',
            dataIndex: 'remaining',
            key: 'remaining',
            align: 'right',
            render: value => formatCurrency(value),
            responsive: ['lg'],
        }
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2}>Satış Raporu</Title>

            {/* İstatistik Kartları */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Toplam Satış"
                            value={statistics.totalAmount}
                            precision={2}
                            formatter={value => formatCurrency(value)}
                            prefix={<DollarOutlined />}
                            suffix={<Text type="secondary" style={{ fontSize: 14 }}>
                                ({statistics.totalSales} adet)
                            </Text>}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tahsil Edilen"
                            value={statistics.totalCollected}
                            precision={2}
                            formatter={value => formatCurrency(value)}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Bekleyen Tahsilat"
                            value={statistics.totalPending}
                            precision={2}
                            formatter={value => formatCurrency(value)}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Gecikmiş Ödemeler"
                            value={statistics.totalOverdue}
                            precision={2}
                            formatter={value => formatCurrency(value)}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Grafikler */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Aylık Satış Grafiği">
                        <div style={{ height: '300px' }}>
                            <Line
                                data={monthlySalesData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        }
                                    }
                                }}
                            />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Ödeme Durumu Dağılımı">
                        <div style={{ height: '300px' }}>
                            <Pie
                                data={paymentStatusData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        }
                                    }
                                }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Proje Bazlı Satışlar Tablosu */}
            <Card title="Proje Bazlı Satışlar">
                <Table
                    columns={projectColumns}
                    dataSource={Object.entries(projectSales).map(([name, data]) => ({
                        key: name,
                        name,
                        ...data
                    }))}
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                />
            </Card>
        </Space>
    );
};

export default SalesReport;
