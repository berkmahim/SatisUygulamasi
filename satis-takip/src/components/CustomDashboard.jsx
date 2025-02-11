import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Spin, Empty } from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { getDashboardStats } from '../services/reportService';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const { Option } = Select;

const CustomDashboard = () => {
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [period]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats(period);
            setStats(data);
        } catch (error) {
            console.error('Dashboard verisi yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    if (!stats) {
        return <Empty description="Veri bulunamadı" />;
    }

    return (
        <Spin spinning={loading}>
            <div style={{ padding: '24px' }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                        <Select
                            value={period}
                            onChange={setPeriod}
                            style={{ width: 200 }}
                        >
                            <Option value="week">Haftalık</Option>
                            <Option value="month">Aylık</Option>
                            <Option value="quarter">3 Aylık</Option>
                            <Option value="year">Yıllık</Option>
                        </Select>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="Satış Trendi">
                            <div style={{ height: 300 }}>
                                <Line
                                    data={{
                                        labels: stats.salesTrend.labels,
                                        datasets: [{
                                            label: 'Satış Tutarı',
                                            data: stats.salesTrend.data,
                                            borderColor: 'rgb(75, 192, 192)',
                                            tension: 0.1
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Tahsilat Durumu">
                            <div style={{ height: 300 }}>
                                <Doughnut
                                    data={{
                                        labels: ['Tahsil Edilen', 'Bekleyen', 'Gecikmiş'],
                                        datasets: [{
                                            data: [
                                                stats.payments.collected,
                                                stats.payments.pending,
                                                stats.payments.overdue
                                            ],
                                            backgroundColor: [
                                                'rgb(75, 192, 192)',
                                                'rgb(255, 205, 86)',
                                                'rgb(255, 99, 132)'
                                            ]
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Proje Bazlı Satışlar">
                            <div style={{ height: 300 }}>
                                <Bar
                                    data={{
                                        labels: stats.projectSales.labels,
                                        datasets: [{
                                            label: 'Satış Adedi',
                                            data: stats.projectSales.data,
                                            backgroundColor: 'rgba(54, 162, 235, 0.5)'
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Ödeme Yöntemleri">
                            <div style={{ height: 300 }}>
                                <Pie
                                    data={{
                                        labels: stats.paymentMethods.labels,
                                        datasets: [{
                                            data: stats.paymentMethods.data,
                                            backgroundColor: [
                                                'rgb(255, 99, 132)',
                                                'rgb(54, 162, 235)',
                                                'rgb(255, 205, 86)',
                                                'rgb(75, 192, 192)'
                                            ]
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Spin>
    );
};

export default CustomDashboard;
