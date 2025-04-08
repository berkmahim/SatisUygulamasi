import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const response = await axios.post('/api/auth/login', values);
            
            // İki faktörlü kimlik doğrulama kontrolü
            if (response.data.requireTwoFactor) {
                // İki faktörlü doğrulama sayfasına yönlendir
                navigate(`/two-factor/login?userId=${response.data.userId}&token=${response.data.tempToken}`);
                return;
            }
            
            // Normal giriş işlemi
            const userData = response.data;
            login(userData, userData.token);
            navigate('/');
            message.success('Giriş başarılı!');
        } catch (error) {
            setError(error.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f0f2f5'
        }}>
            <Card
                title="Satış Takip Sistemi"
                style={{
                    width: 400,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
            >
                <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin!' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Kullanıcı Adı"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Şifre"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            style={{ width: '100%' }}
                            loading={loading}
                        >
                            Giriş Yap
                        </Button>
                    </Form.Item>
                    {error && (
                        <div style={{ color: 'red' }}>{error}</div>
                    )}
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
