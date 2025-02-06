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
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

// Chart.js bileşenlerini kaydet
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
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Satış Raporu</h1>

            {/* Genel İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Toplam Satış</h3>
                    <p className="text-3xl font-bold text-blue-600">{statistics.totalSales}</p>
                    <p className="text-gray-500">{formatCurrency(statistics.totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Tahsil Edilen</h3>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(statistics.totalCollected)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Bekleyen Tahsilat</h3>
                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(statistics.totalPending)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Gecikmiş Ödemeler</h3>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(statistics.totalOverdue)}</p>
                </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aylık Satış Grafiği */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Aylık Satış Grafiği</h3>
                    <Line
                        data={monthlySalesData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: false
                                }
                            }
                        }}
                    />
                </div>

                {/* Ödeme Durumu Dağılımı */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Ödeme Durumu Dağılımı</h3>
                    <Pie
                        data={paymentStatusData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                }
                            }
                        }}
                    />
                </div>

                {/* Proje Bazlı Satışlar */}
                <div className="bg-white rounded-lg shadow-md p-6 col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Proje Bazlı Satışlar</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2">Proje</th>
                                    <th className="px-4 py-2">Satış Sayısı</th>
                                    <th className="px-4 py-2">Toplam Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectSales && Object.values(projectSales).map((project) => (
                                    <tr key={project.projectId} className="border-t">
                                        <td className="px-4 py-2">{project.name}</td>
                                        <td className="px-4 py-2 text-center">{project.count}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(project.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
