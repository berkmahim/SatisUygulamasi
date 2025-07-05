import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlockById } from '../services/blockService';
import { searchCustomers } from '../services/customerService';

const BlockSalePage = () => {
    const { projectId, blockId } = useParams();
    const navigate = useNavigate();
    const [block, setBlock] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const data = await getBlockById(blockId);
                setBlock(data);
            } catch (error) {
                console.error('Error fetching block:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlock();
    }, [blockId]);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length >= 2) {
            try {
                const results = await searchCustomers(value);
                setCustomers(results);
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        } else {
            setCustomers([]);
        }
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomers([]);
        setSearchTerm('');
    };

    const handleSale = () => {
        if (selectedCustomer) {
            navigate(`/projects/${projectId}/blocks/${blockId}/payment-plan`, {
                state: { customer: selectedCustomer }
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Blok Satış/Rezervasyon</h1>

                {/* Blok Bilgileri */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Blok Bilgileri</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Blok ID:</p>
                            <p className="font-medium">{block?._id}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Tipi:</p>
                            <p className="font-medium">{block?.type || 'Belirtilmemiş'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Birim No:</p>
                            <p className="font-medium">{block?.unitNumber || 'Belirtilmemiş'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Metrekare:</p>
                            <p className="font-medium">{block?.squareMeters || 'Belirtilmemiş'}</p>
                        </div>
                    </div>
                </div>

                {/* Müşteri Arama */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Müşteri Seçimi</h2>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Müşteri ara (TC, telefon veya isim)"
                            className="w-full p-3 border rounded-lg"
                            style={{ backgroundColor: 'white' }}
                            color="black"
                        />
                        {customers.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                {customers.map((customer) => (
                                    <div
                                        key={customer._id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className="p-3 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <p className="font-medium">
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            TC: {customer.tcNo} | Tel: {customer.phone}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedCustomer && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium mb-2">Seçilen Müşteri:</h3>
                            <p>
                                {selectedCustomer.firstName} {selectedCustomer.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                                TC: {selectedCustomer.tcNo} | Tel: {selectedCustomer.phone}
                            </p>
                        </div>
                    )}
                </div>

                {/* İşlem Butonları */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        İptal
                    </button>
                    {/* <button
                        onClick={() => {
                            if (selectedCustomer) {
                                // TODO: Implement reservation logic
                                console.log('Rezervasyon yapılıyor...');
                            }
                        }}
                        disabled={!selectedCustomer}
                        className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300"
                    >
                        Rezerve Et
                    </button> */}
                    <button
                        onClick={handleSale}
                        disabled={!selectedCustomer}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                    >
                        Satış Yap
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockSalePage;
