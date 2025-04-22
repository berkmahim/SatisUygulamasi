import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { LockOutlined, KeyOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;
const BASE_URL = import.meta.env.VITE_API_URL;
const TwoFactorDisablePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();

  // Eğer 2FA etkinleştirilmemişse, kullanıcı profil sayfasına yönlendir
  if (!user.twoFactorEnabled) {
    navigate('/profile');
    return null;
  }

  const handleDisable = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${BASE_URL}/api/auth/2fa/disable`, {
        token: values.token,
        password: values.password
      });
      
      // Kullanıcı bilgilerini güncelle
      updateUserInfo({ twoFactorEnabled: false });
      
      navigate('/profile');
    } catch (error) {
      setError(error.response?.data?.message || 'İki faktörlü kimlik doğrulamayı devre dışı bırakırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SafetyOutlined style={{ fontSize: 24, marginRight: 10 }} />
            <span>İki Faktörlü Kimlik Doğrulamayı Devre Dışı Bırak</span>
          </div>
        }
      >
        <Alert
          message="Güvenlik Uyarısı"
          description="İki faktörlü kimlik doğrulamayı devre dışı bırakmak hesap güvenliğinizi azaltacaktır. Bu adımı sadece gerçekten gerekiyorsa devam ettirin."
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
        />

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleDisable}
        >
          <Form.Item
            name="password"
            label="Mevcut Şifreniz"
            rules={[
              { required: true, message: 'Lütfen şifrenizi girin' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Şifreniz"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="token"
            label="Kimlik Doğrulama Kodu"
            rules={[
              { required: true, message: 'Lütfen kimlik doğrulama kodunu girin' },
              { len: 6, message: 'Kod 6 haneli olmalıdır' }
            ]}
          >
            <Input
              prefix={<KeyOutlined />}
              placeholder="123456"
              size="large"
              maxLength={6}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/settings')}
              >
                İptal
              </Button>
              <Button
                type="danger"
                htmlType="submit"
                loading={loading}
                icon={<SafetyOutlined />}
              >
                2FA'yı Devre Dışı Bırak
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Paragraph style={{ marginTop: 16 }}>
          Not: İki faktörlü kimlik doğrulamayı devre dışı bırakmak için, kimlik doğrulama uygulamanızdaki geçerli kodu ve şifrenizi girmeniz gerekmektedir.
        </Paragraph>
      </Card>
    </div>
  );
};

export default TwoFactorDisablePage;
