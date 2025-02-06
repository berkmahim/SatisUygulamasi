import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching project details for ID:', id);

                // Proje detaylarını getir
                const projectResponse = await axios.get(`/api/projects/${id}`);
                console.log('Project response:', projectResponse.data);
                setProject(projectResponse.data);

                // Projeye ait satışları getir
                const salesResponse = await axios.get(`/api/sales/project/${id}`);
                console.log('Sales response:', salesResponse.data);
                setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
            } catch (error) {
                console.error('Error fetching project details:', error);
                setError(error.response?.data?.message || 'Bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetails();
    }, [id]);

    const handlePaymentClick = (saleId) => {
        navigate(`/sales/${saleId}/payments`);
    };

    // Ödeme durumu renkleri
    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partial':
                return 'bg-blue-100 text-blue-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Ödeme durumu metinleri
    const getPaymentStatusText = (status) => {
        switch (status) {
            case 'paid':
                return 'Ödendi';
            case 'partial':
                return 'Kısmi Ödeme';
            case 'overdue':
                return 'Gecikmiş';
            case 'pending':
                return 'Bekliyor';
            default:
                return 'Belirsiz';
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600">
                Hata: {error}
            </div>
        );
    }

    if (!project) {
        return <div className="flex justify-center items-center h-screen">Proje bulunamadı</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Proje Başlığı */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                    <p className="mt-2 text-gray-600">{project.location}</p>
                </div>

                {/* Proje Detayları */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Proje Detayları</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Proje ID:</p>
                            <p className="font-medium">{project._id}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Konum:</p>
                            <p className="font-medium">{project.location}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Oluşturulma Tarihi:</p>
                            <p className="font-medium">
                                {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Son Güncelleme:</p>
                            <p className="font-medium">
                                {new Date(project.updatedAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Satışlar */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Satışlar</h2>
                    {sales.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2">Blok No</th>
                                        <th className="px-4 py-2">Müşteri</th>
                                        <th className="px-4 py-2">Telefon</th>
                                        <th className="px-4 py-2">TC No</th>
                                        <th className="px-4 py-2">Satış Türü</th>
                                        <th className="px-4 py-2">Ödeme Durumu</th>
                                        <th className="px-4 py-2">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => (
                                        <tr key={sale._id} className="border-t">
                                            <td className="px-4 py-2">{sale.block.unitNumber}</td>
                                            <td className="px-4 py-2">{`${sale.customer.firstName} ${sale.customer.lastName}`}</td>
                                            <td className="px-4 py-2">{sale.customer.phone}</td>
                                            <td className="px-4 py-2">{sale.customer.tcNo}</td>
                                            <td className="px-4 py-2">{sale.type === 'sale' ? 'Satış' : 'Rezervasyon'}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-sm ${getPaymentStatusColor(sale.paymentStatus)}`}>
                                                    {getPaymentStatusText(sale.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => handlePaymentClick(sale._id)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                                >
                                                    Ödemeler
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Henüz satış kaydı bulunmamaktadır.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
