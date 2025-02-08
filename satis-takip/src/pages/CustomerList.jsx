import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm } from 'antd';
import { getAllCustomers, updateCustomer, deleteCustomer } from '../services/customerService';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
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
        setEditModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            await updateCustomer(selectedCustomer._id, values);
            message.success('Müşteri başarıyla güncellendi');
            setEditModalVisible(false);
            fetchCustomers();
        } catch (error) {
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Müşteri güncellenirken bir hata oluştu');
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

    const columns = [
        {
            title: 'Ad',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'Soyad',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'TC No',
            dataIndex: 'tcNo',
            key: 'tcNo',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <span>
                    <Button type="link" onClick={() => handleEdit(record)}>
                        Düzenle
                    </Button>
                    <Popconfirm
                        title="Müşteriyi silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button type="link" danger>
                            Sil
                        </Button>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h2>Müşteri Listesi</h2>
            <Table
                columns={columns}
                dataSource={customers}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title="Müşteri Düzenle"
                visible={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    onFinish={handleUpdate}
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
                        rules={[{ required: true, message: 'Lütfen TC No giriniz' }]}
                    >
                        <Input />
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
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Güncelle
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomerList;
