import React, { useState, useEffect } from 'react';
import { 
    Table, Button, Modal, Form, Input, message, Popconfirm, 
    Card, Typography, Space, Row, Col, Input as AntInput 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getAllCustomers, updateCustomer, deleteCustomer, createCustomer } from '../services/customerService';
import './CustomerList.css';

const { Title } = Typography;
const { Search } = AntInput;

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await getAllCustomers();
            setCustomers(data);
        } catch (error) {
            message.error('Müşteriler yüklenirken bir hata oluştu');
        }
        setLoading(false);
    };

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        form.setFieldsValue(customer);
        setModalVisible(true);
    };

    const handleAdd = () => {
        setSelectedCustomer(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            if (selectedCustomer) {
                await updateCustomer(selectedCustomer._id, values);
                message.success('Müşteri başarıyla güncellendi');
            } else {
                await createCustomer(values);
                message.success('Müşteri başarıyla eklendi');
            }
            setModalVisible(false);
            fetchCustomers();
        } catch (error) {
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error(selectedCustomer ? 'Müşteri güncellenirken bir hata oluştu' : 'Müşteri eklenirken bir hata oluştu');
            }
        }
    };

    const handleDelete = async (customerId) => {
        try {
            await deleteCustomer(customerId);
            message.success('Müşteri başarıyla silindi');
            fetchCustomers();
        } catch (error) {
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Müşteri silinirken bir hata oluştu');
            }
        }
    };

    const getFilteredCustomers = () => {
        if (!searchText) return customers;
        
        const searchLower = searchText.toLowerCase();
        return customers.filter(customer => 
            customer.firstName.toLowerCase().includes(searchLower) ||
            customer.lastName.toLowerCase().includes(searchLower) ||
            customer.tcNo.includes(searchText) ||
            customer.email.toLowerCase().includes(searchLower)
        );
    };

    const columns = [
        {
            title: 'Ad',
            dataIndex: 'firstName',
            key: 'firstName',
            responsive: ['sm'],
        },
        {
            title: 'Soyad',
            dataIndex: 'lastName',
            key: 'lastName',
            responsive: ['sm'],
        },
        {
            title: 'Ad Soyad',
            key: 'fullName',
            responsive: ['xs'],
            render: (_, record) => `${record.firstName} ${record.lastName}`,
        },
        {
            title: 'TC No',
            dataIndex: 'tcNo',
            key: 'tcNo',
            responsive: ['md'],
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            responsive: ['lg'],
        },
        {
            title: 'İşlemler',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Müşteriyi silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                <Col flex="auto">
                    <Title level={2} style={{ margin: 0 }}>Müşteri Listesi</Title>
                </Col>
                <Col flex="none">
                    <Space>
                        <Search
                            placeholder="Müşteri ara..."
                            allowClear
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                        >
                            <span className="button-text">Yeni Müşteri</span>
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={getFilteredCustomers()}
                rowKey="_id"
                loading={loading}
                scroll={{ x: 'max-content' }}
                pagination={{
                    position: ['bottomCenter'],
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} müşteri`,
                }}
            />

            <Modal
                title={selectedCustomer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        name="firstName"
                        label="Ad"
                        rules={[{ required: true, message: 'Lütfen adı giriniz' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="lastName"
                        label="Soyad"
                        rules={[{ required: true, message: 'Lütfen soyadı giriniz' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="tcNo"
                        label="TC No"
                        rules={[
                            { required: true, message: 'Lütfen TC No giriniz' },
                            { len: 11, message: 'TC No 11 haneli olmalıdır' },
                            { pattern: /^[0-9]*$/, message: 'TC No sadece rakam içermelidir' }
                        ]}
                    >
                        <Input maxLength={11} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Lütfen email giriniz' },
                            { type: 'email', message: 'Geçerli bir email giriniz' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                İptal
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {selectedCustomer ? 'Güncelle' : 'Ekle'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default CustomerList;
