import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Input, Button, Modal, Form, message, Space, Typography, List } from 'antd';
import { PlusOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getBlockById } from '../services/blockService';
import { searchCustomers, createCustomer } from '../services/customerService';

const { Title, Text } = Typography;

const BulkSaleCustomerPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedBlockIds } = location.state || {};
    
    const [blocks, setBlocks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerForm] = Form.useForm();

    useEffect(() => {
        const fetchBlocks = async () => {
            if (!selectedBlockIds || selectedBlockIds.length === 0) {
                navigate(`/projects/${projectId}/building`);
                return;
            }

            try {
                // Fetch all selected blocks
                const blockPromises = selectedBlockIds.map(blockId => getBlockById(blockId));
                const blockData = await Promise.all(blockPromises);
                setBlocks(blockData);
            } catch (error) {
                console.error('Error fetching blocks:', error);
                message.error('Blok bilgileri yüklenirken hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchBlocks();
    }, [selectedBlockIds, projectId, navigate]);

    // Reuse the exact same customer search logic from BlockSalePage
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

    const handleProceed = () => {
        if (selectedCustomer) {
            navigate(`/projects/${projectId}/blocks/bulk-payment-plan`, {
                state: { 
                    customer: selectedCustomer,
                    selectedBlockIds: selectedBlockIds,
                    blocks: blocks 
                }
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
                <div className="flex items-center mb-6">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate(`/projects/${projectId}/building`)}
                        style={{ marginRight: 16 }}
                    >
                        Geri
                    </Button>
                    <Title level={2} style={{ margin: 0 }}>
                        Toplu Satış - Müşteri Seçimi
                    </Title>
                </div>

                {/* Selected Blocks Summary */}
                <Card title="Seçilen Birimler" className="mb-6">
                    <List
                        size="small"
                        dataSource={blocks}
                        renderItem={(block) => (
                            <List.Item>
                                <Text strong>Birim {block.unitNumber || block._id.slice(-6)}</Text>
                                <span style={{ marginLeft: 16, color: '#666' }}>
                                    {block.type === 'apartment' ? 'Daire' : 'Ofis'}
                                    {block.squareMeters && ` - ${block.squareMeters} m²`}
                                </span>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Customer Selection - Exact same UI as BlockSalePage */}
                <Card title="Müşteri Seçimi" className="mb-6">
                    {selectedCustomer ? (
                        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Text strong className="text-lg">
                                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                                    </Text>
                                    <br />
                                    <Text type="secondary">{selectedCustomer.email}</Text>
                                    <br />
                                    <Text type="secondary">{selectedCustomer.phone}</Text>
                                </div>
                                <Button 
                                    type="link" 
                                    onClick={() => setSelectedCustomer(null)}
                                    style={{ color: '#1890ff' }}
                                >
                                    Değiştir
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Space direction="vertical" className="w-full">
                            <Input
                                placeholder="Müşteri ara (ad, soyad, telefon, email)..."
                                value={searchTerm}
                                onChange={handleSearch}
                                prefix={<UserOutlined />}
                                size="large"
                            />
                            
                            {customers.length > 0 && (
                                <div className="border rounded max-h-64 overflow-y-auto">
                                    {customers.map(customer => (
                                        <div
                                            key={customer._id}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                            onClick={() => handleCustomerSelect(customer)}
                                        >
                                            <div className="font-medium">
                                                {customer.firstName} {customer.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {customer.email} • {customer.phone}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <Button 
                                type="dashed" 
                                icon={<PlusOutlined />} 
                                onClick={() => setShowCustomerModal(true)}
                                size="large"
                                className="w-full"
                            >
                                Yeni Müşteri Oluştur
                            </Button>
                        </Space>
                    )}
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <Button size="large" onClick={() => navigate(`/projects/${projectId}/building`)}>
                        İptal
                    </Button>
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={handleProceed}
                        disabled={!selectedCustomer}
                    >
                        Ödeme Planına Devam Et
                    </Button>
                </div>

                {/* Customer Creation Modal - Exact same as BlockSalePage */}
                <Modal
                    title="Yeni Müşteri Oluştur"
                    open={showCustomerModal}
                    onCancel={() => setShowCustomerModal(false)}
                    footer={null}
                    width={600}
                >
                    <Form 
                        form={customerForm} 
                        onFinish={handleCreateCustomer} 
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item 
                            name="firstName" 
                            label="Ad" 
                            rules={[{ required: true, message: 'Ad alanı zorunludur' }]}
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item 
                            name="lastName" 
                            label="Soyad" 
                            rules={[{ required: true, message: 'Soyad alanı zorunludur' }]}
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item 
                            name="email" 
                            label="E-posta" 
                            rules={[
                                { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        
                        <Form.Item name="phone" label="Telefon">
                            <Input />
                        </Form.Item>
                        
                        <Form.Item name="address" label="Adres">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" size="large">
                                    Müşteri Oluştur
                                </Button>
                                <Button 
                                    size="large"
                                    onClick={() => setShowCustomerModal(false)}
                                >
                                    İptal
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default BulkSaleCustomerPage;