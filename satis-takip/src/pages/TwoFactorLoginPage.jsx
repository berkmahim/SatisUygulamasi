import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Form, message, Typography, Tabs, Space, Divider, Alert } from 'antd';
import { LockOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TwoFactorLoginPage = () => {
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // URL parametrelerinden kullanıcı ID ve geçici token alınması
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');
  const tempToken = queryParams.get('token');

  useEffect(() => {
    // Gerekli parametreler yoksa login sayfasına yönlendir
    if (!userId || !tempToken) {
      navigate('/login');
    }
  }, [userId, tempToken, navigate]);

  const verifyTOTP = async () => {
    if (!token || token.length !== 6) {
      setError('Lütfen geçerli bir 6 haneli kod girin');
      return;
    }

    await verify(token, false);
  };

  const verifyBackupCode = async () => {
    if (!backupCode || backupCode.length < 8) {
      setError('Lütfen geçerli bir yedek kod girin');
      return;
    }

    await verify(backupCode, true);
  };

  const verify = async (code, isBackupCode) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/2fa/login`, {
        userId,
        token: code,
        isBackupCode
      });

      const userData = response.data.user;
      
      // Auth Context login fonksiyonunu çağır
      login(userData, tempToken);
      
      message.success('Giriş başarılı!');
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Doğrulama kodu geçersiz');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#ffffff' 
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
        }}
        title={
          <div style={{ textAlign: 'center' }}>
            <SafetyOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 10, marginBottom: 0 }}>
              İki Faktörlü Doğrulama
            </Title>
          </div>
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Text style={{ display: 'block', marginBottom: 20, textAlign: 'center' }}>
          Lütfen kimlik doğrulama uygulamanızdaki 6 haneli kodu girin veya yedek kodlarınızdan birini kullanın.
        </Text>

        <Tabs defaultActiveKey="totp">
          <TabPane 
            tab={
              <span>
                <KeyOutlined /> Doğrulama Kodu
              </span>
            } 
            key="totp"
          >
            <Form layout="vertical">
              <Form.Item label="Kimlik Doğrulama Kodu">
                <Input
                  prefix={<LockOutlined />}
                  size="large"
                  placeholder="123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={6}
                  autoFocus
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  onClick={verifyTOTP} 
                  loading={loading} 
                  block 
                  size="large"
                >
                  Doğrula ve Giriş Yap
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <SafetyOutlined /> Yedek Kod
              </span>
            } 
            key="backup"
          >
            <Form layout="vertical">
              <Form.Item label="Yedek Kod">
                <Input
                  prefix={<LockOutlined />}
                  size="large"
                  placeholder="ABCD1234"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  onClick={verifyBackupCode} 
                  loading={loading} 
                  block 
                  size="large"
                >
                  Yedek Kod ile Giriş Yap
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary">
              Kimlik doğrulama uygulamanıza erişiminizi kaybettiyseniz,
              yedek kodlarınızdan birini kullanabilirsiniz.
            </Text>
            <Button 
              type="link" 
              onClick={() => navigate('/login')}
            >
              Giriş sayfasına dön
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default TwoFactorLoginPage;
