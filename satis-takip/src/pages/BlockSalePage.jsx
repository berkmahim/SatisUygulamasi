import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Input, Button, Modal, Form, message, Space } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { getBlockById } from '../services/blockService';
import { searchCustomers, createCustomer } from '../services/customerService';
import { useTheme } from '../context/ThemeContext';

const BlockSalePage = () => {
    const { projectId, blockId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [block, setBlock] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerForm] = Form.useForm();

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

    const handleCreateCustomer = async (values) => {
        try {
            const newCustomer = await createCustomer(values);
            setSelectedCustomer(newCustomer);
            setShowCustomerModal(false);
            customerForm.resetFields();
            message.success('Müşteri başarıyla oluşturuldu');
        } catch (error) {
            console.error('Error creating customer:', error);
            message.error(error.response?.data?.message || 'Müşteri oluşturulurken bir hata oluştu');
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
                <div className={`rounded-lg shadow-md p-6 mb-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Blok Bilgileri
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Blok ID:</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {block?._id}
                            </p>
                        </div>
                        <div>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tipi:</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {block?.type || 'Belirtilmemiş'}
                            </p>
                        </div>
                        <div>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Birim No:</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {block?.unitNumber || 'Belirtilmemiş'}
                            </p>
                        </div>
                        <div>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Metrekare:</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {block?.squareMeters || 'Belirtilmemiş'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Müşteri Arama */}
                <div className={`rounded-lg shadow-md p-6 mb-8 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Müşteri Seçimi
                        </h2>
                        <Button 
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setShowCustomerModal(true)}
                        >
                            Yeni Müşteri Ekle
                        </Button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Müşteri ara (TC, telefon veya isim)"
                            className={`w-full p-3 border rounded-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300 text-black placeholder-gray-500'
                            }`}
                        />
                        {customers.length > 0 && (
                            <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${
                                isDarkMode 
                                    ? 'bg-gray-700 border-gray-600' 
                                    : 'bg-white border-gray-300'
                            }`}>
                                {customers.map((customer) => (
                                    <div
                                        key={customer._id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        className={`p-3 cursor-pointer ${
                                            isDarkMode 
                                                ? 'hover:bg-gray-600 text-white' 
                                                : 'hover:bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        <p className="font-medium">
                                            {customer.firstName} {customer.lastName}
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            TC: {customer.tcNo} | Tel: {customer.phone}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedCustomer && (
                        <div className={`mt-4 p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                            <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Seçilen Müşteri:
                            </h3>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                {selectedCustomer.firstName} {selectedCustomer.lastName}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

                {/* Customer Creation Modal */}
                <Modal
                    title="Yeni Müşteri Ekle"
                    open={showCustomerModal}
                    onOk={() => customerForm.submit()}
                    onCancel={() => {
                        setShowCustomerModal(false);
                        customerForm.resetFields();
                    }}
                    okText="Müşteri Ekle"
                    cancelText="İptal"
                    width={600}
                >
                    <Form
                        form={customerForm}
                        layout="vertical"
                        onFinish={handleCreateCustomer}
                    >
                        <Form.Item
                            name="firstName"
                            label="Ad"
                            rules={[{ required: true, message: 'Lütfen adı giriniz' }]}
                        >
                            <Input placeholder="Müşteri adını giriniz" />
                        </Form.Item>
                        
                        <Form.Item
                            name="lastName"
                            label="Soyad"
                            rules={[{ required: true, message: 'Lütfen soyadı giriniz' }]}
                        >
                            <Input placeholder="Müşteri soyadını giriniz" />
                        </Form.Item>
                        
                        <Form.Item
                            name="tcNo"
                            label="TC Kimlik No"
                            rules={[{ required: true, message: 'Lütfen TC kimlik numarasını giriniz' }]}
                        >
                            <Input placeholder="TC kimlik numarasını giriniz" maxLength={11} />
                        </Form.Item>
                        
                        <Form.Item
                            name="phone"
                            label="Telefon"
                            rules={[{ required: true, message: 'Lütfen telefon numarasını giriniz' }]}
                        >
                            <Input placeholder="Telefon numarasını giriniz" />
                        </Form.Item>
                        
                        <Form.Item
                            name="email"
                            label="E-posta"
                            rules={[
                                { required: true, message: 'Lütfen e-posta adresi giriniz' },
                                { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
                            ]}
                        >
                            <Input placeholder="E-posta adresini giriniz" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default BlockSalePage;
