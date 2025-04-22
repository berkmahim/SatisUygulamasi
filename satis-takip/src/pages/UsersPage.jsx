import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    Card,
    Popconfirm,
    Typography
} from 'antd';
import {
    UserAddOutlined,
    EditOutlined,
    DeleteOutlined,
    LockOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;
const BASE_URL = import.meta.env.VITE_API_URL;
const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${BASE_URL}/api/auth/users`);
            setUsers(data);
        } catch (error) {
            message.error('Kullanıcılar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddEdit = async (values) => {
        try {
            if (editingUser) {
                await axios.put(`${BASE_URL}/api/auth/users/${editingUser._id}`, values);
                message.success('Kullanıcı güncellendi');
            } else {
                await axios.post(`${BASE_URL}/api/auth/register`, values);
                message.success('Kullanıcı oluşturuldu');
            }
            setModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/api/auth/users/${id}`);
            message.success('Kullanıcı silindi');
            fetchUsers();
        } catch (error) {
            message.error('Kullanıcı silinirken bir hata oluştu');
        }
    };

    const showModal = (user = null) => {
        setEditingUser(user);
        form.resetFields();
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive
            });
        }
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'Kullanıcı Adı',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Ad Soyad',
            dataIndex: 'fullName',
            key: 'fullName',
        },
        {
            title: 'E-posta',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Rol',
            dataIndex: 'role',
            key: 'role',
            render: (role) => role === 'admin' ? 'Admin' : 'Kullanıcı'
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Switch
                    checked={isActive}
                    disabled
                    checkedChildren="Aktif"
                    unCheckedChildren="Pasif"
                />
            )
        },
        {
            title: 'İşlemler',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                        type="primary"
                        ghost
                    >
                        Düzenle
                    </Button>
                    <Popconfirm
                        title="Bu kullanıcıyı silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            type="primary"
                            danger
                            ghost
                            disabled={record._id === currentUser._id}
                        >
                            Sil
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                    <Title level={3}>Kullanıcı Yönetimi</Title>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => showModal()}
                    >
                        Yeni Kullanıcı
                    </Button>
                </Space>

                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="_id"
                    loading={loading}
                />

                <Modal
                    title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setEditingUser(null);
                        form.resetFields();
                    }}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleAddEdit}
                        initialValues={{
                            role: 'user',
                            isActive: true,
                            permissions: {
                                projectManagement: false,
                                salesManagement: false,
                                customerManagement: false,
                                paymentManagement: false,
                                reportManagement: false,
                                userManagement: false,
                                paymentOverdueNotification: false
                            }
                        }}
                    >
                        <Form.Item
                            name="username"
                            label="Kullanıcı Adı"
                            rules={[{ required: true, message: 'Kullanıcı adı gerekli!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="E-posta"
                            rules={[
                                { required: true, message: 'E-posta gerekli!' },
                                { type: 'email', message: 'Geçerli bir e-posta girin!' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="fullName"
                            label="Ad Soyad"
                            rules={[{ required: true, message: 'Ad soyad gerekli!' }]}
                        >
                            <Input />
                        </Form.Item>

                        {!editingUser && (
                            <Form.Item
                                name="password"
                                label="Şifre"
                                rules={[{ required: true, message: 'Şifre gerekli!' }]}
                            >
                                <Input.Password />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="role"
                            label="Rol"
                            rules={[{ required: true, message: 'Rol seçimi gerekli!' }]}
                        >
                            <Select>
                                <Option value="user">Kullanıcı</Option>
                                <Option value="admin">Admin</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'projectManagement']}
                            valuePropName="checked"
                            label="Proje Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'salesManagement']}
                            valuePropName="checked"
                            label="Satış Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'customerManagement']}
                            valuePropName="checked"
                            label="Müşteri Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'paymentManagement']}
                            valuePropName="checked"
                            label="Ödeme Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'reportManagement']}
                            valuePropName="checked"
                            label="Rapor Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'userManagement']}
                            valuePropName="checked"
                            label="Kullanıcı Yönetimi"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name={['permissions', 'paymentOverdueNotification']}
                            valuePropName="checked"
                            label="Ödeme Gecikme Bildirimleri"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item
                            name="isActive"
                            valuePropName="checked"
                            label="Aktif"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    {editingUser ? 'Güncelle' : 'Oluştur'}
                                </Button>
                                <Button onClick={() => {
                                    setModalVisible(false);
                                    setEditingUser(null);
                                    form.resetFields();
                                }}>
                                    İptal
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default UsersPage;
