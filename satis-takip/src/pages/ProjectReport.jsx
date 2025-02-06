import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { Bar, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

const ProjectReport = () => {
    const { projectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [stats, setStats] = useState(null);
    const [blockStats, setBlockStats] = useState([]);
    const [paymentStats, setPaymentStats] = useState(null);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true);
                
                const [projectRes, statsRes] = await Promise.all([
                    axios.get(`/api/projects/${projectId}`),
                    axios.get(`/api/reports/projects/${projectId}/stats`)
                ]);

                setProject(projectRes.data);
                setStats(statsRes.data.stats);
                setBlockStats(statsRes.data.blockStats);
                setPaymentStats(statsRes.data.paymentStats);
                
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Rapor verileri alınırken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);

    // Para formatı
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Blok satış grafiği verileri
    const blockSalesData = {
        labels: blockStats.map(block => `Blok ${block.blockNumber}`),
        datasets: [
            {
                label: 'Satılan Daire Sayısı',
                data: blockStats.map(block => block.soldUnits),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Toplam Daire Sayısı',
                data: blockStats.map(block => block.totalUnits),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }
        ]
    };

    // Ödeme durumu pasta grafiği verileri
    const paymentStatusData = paymentStats ? {
        labels: ['Ödendi', 'Kısmi Ödeme', 'Gecikmiş', 'Bekliyor'],
        datasets: [
            {
                data: [
                    paymentStats.paid,
                    paymentStats.partial,
                    paymentStats.overdue,
                    paymentStats.pending
                ],
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
    } : null;

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">{project?.name} Proje Raporu</h1>

            {/* Genel İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Toplam Satış</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats?.totalSales || 0}</p>
                    <p className="text-gray-500">{formatCurrency(stats?.totalAmount || 0)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Tahsil Edilen</h3>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalCollected || 0)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Bekleyen Tahsilat</h3>
                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats?.totalPending || 0)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">Gecikmiş Ödemeler</h3>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(stats?.totalOverdue || 0)}</p>
                </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Blok Satış Grafiği */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Blok Satış Durumu</h3>
                    <Bar
                        data={blockSalesData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }}
                    />
                </div>

                {/* Ödeme Durumu Dağılımı */}
                {paymentStatusData && (
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
                )}
            </div>

            {/* Blok Detayları */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Blok Detayları</h3>
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2">Blok No</th>
                                <th className="px-4 py-2">Toplam Daire</th>
                                <th className="px-4 py-2">Satılan Daire</th>
                                <th className="px-4 py-2">Doluluk Oranı</th>
                                <th className="px-4 py-2">Toplam Satış Tutarı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blockStats.map((block) => (
                                <tr key={block.blockId} className="border-t">
                                    <td className="px-4 py-2 text-center">Blok {block.blockNumber}</td>
                                    <td className="px-4 py-2 text-center">{block.totalUnits}</td>
                                    <td className="px-4 py-2 text-center">{block.soldUnits}</td>
                                    <td className="px-4 py-2 text-center">
                                        {((block.soldUnits / block.totalUnits) * 100).toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(block.totalAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectReport;
