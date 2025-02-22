import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        try {
            const result = await login(values.username, values.password);
            if (!result.success) {
                if (result.error.includes('pasif durumda')) {
                    message.error({
                        content: result.error,
                        duration: 5,
                        style: {
                            marginTop: '20vh',
                        },
                    });
                } else {
                    message.error({
                        content: result.error,
                        style: {
                            marginTop: '20vh',
                        },
                    });
                }
            }
        } catch (error) {
            message.error({
                content: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.',
                style: {
                    marginTop: '20vh',
                },
            });
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
                    onFinish={onFinish}
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
                        >
                            Giriş Yap
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
