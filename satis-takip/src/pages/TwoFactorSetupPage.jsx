import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Alert, Steps, Result, Typography, Row, Col, Space, Divider, Tooltip, message } from 'antd';
import { SecurityScanOutlined, QrcodeOutlined, KeyOutlined, LockOutlined, CheckCircleOutlined, CopyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const TwoFactorSetupPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();

  useEffect(() => {
    // Eğer 2FA zaten etkinleştirilmişse, ayarlar sayfasına yönlendir
    if (user?.twoFactorEnabled) {
      navigate('/settings');
    } else if (currentStep === 0) {
      // İlk adımda QR kodu ve gizli anahtarı al
      generateSecret();
    }
  }, [user, navigate, currentStep]);

  const generateSecret = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/2fa/generate');
      setQrCode(response.data.qrCodeUrl);
      setSecret(response.data.secret);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Gizli anahtar oluşturulurken bir hata oluştu');
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    if (!token || token.length < 6) {
      setError('Lütfen geçerli bir doğrulama kodu girin');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/2fa/verify', { token });
      setBackupCodes(response.data.backupCodes);
      
      // Kullanıcı bilgilerini güncelleme - twoFactorEnabled değerini true yap
      updateUserInfo({ ...user, twoFactorEnabled: true });
      
      setCurrentStep(2);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Doğrulama kodu geçersiz');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Panoya kopyalandı');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const content = 'SATIS TAKIP - YEDEK KODLAR\n\n' + 
                    'Bu kodlar, iki faktörlü kimlik doğrulama uygulamanıza erişiminizi kaybetmeniz durumunda\n' + 
                    'hesabınıza giriş yapmanızı sağlar. Her kod yalnızca bir kez kullanılabilir.\n\n' +
                    backupCodes.join('\n') + 
                    '\n\nBu kodları güvenli bir yerde saklayın ve kimseyle paylaşmayın.';
    
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'satis-takip-yedek-kodlar.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const steps = [
    {
      title: 'Uygulama',
      content: (
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Adım 1: Kimlik Doğrulama Uygulaması Kurulumu</Title>
          <Paragraph>
            İki faktörlü kimlik doğrulama için bir kimlik doğrulama uygulaması kullanmanız gerekiyor.
            Aşağıdaki uygulamalardan birini telefonunuza yükleyin:
          </Paragraph>
          
          <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card title="Google Authenticator">
                <p>Google tarafından sağlanan güvenli kimlik doğrulama uygulaması</p>
                <Space>
                  <Button type="link" href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank">
                    Android
                  </Button>
                  <Button type="link" href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank">
                    iOS
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card title="Microsoft Authenticator">
                <p>Microsoft tarafından sağlanan güvenli kimlik doğrulama uygulaması</p>
                <Space>
                  <Button type="link" href="https://play.google.com/store/apps/details?id=com.azure.authenticator" target="_blank">
                    Android
                  </Button>
                  <Button type="link" href="https://apps.apple.com/app/microsoft-authenticator/id983156458" target="_blank">
                    iOS
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card title="Authy">
                <p>Twilio tarafından sağlanan çoklu cihaz desteği olan kimlik doğrulama uygulaması</p>
                <Space>
                  <Button type="link" href="https://play.google.com/store/apps/details?id=com.authy.authy" target="_blank">
                    Android
                  </Button>
                  <Button type="link" href="https://apps.apple.com/app/authy/id494168017" target="_blank">
                    iOS
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          <Paragraph>
            Uygulamayı yükledikten sonra, <strong>İleri</strong> butonuna tıklayarak devam edin.
          </Paragraph>
          
          <Button type="primary" onClick={() => setCurrentStep(1)} icon={<ArrowLeftOutlined />}>
            İleri
          </Button>
        </div>
      ),
    },
    {
      title: 'QR Kod',
      content: (
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Adım 2: QR Kodunu Tara</Title>
          
          <Paragraph>
            Kimlik doğrulama uygulamanızı açın ve aşağıdaki QR kodunu tarayın 
            veya gizli anahtarı manuel olarak girin.
          </Paragraph>
          
          {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
          
          <div style={{ marginBottom: 20 }}>
            {qrCode ? (
              <img src={qrCode} alt="QR Code" style={{ maxWidth: '200px', margin: '20px auto' }} />
            ) : (
              <div style={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button loading={loading} onClick={generateSecret}>
                  QR Kodu Yenile
                </Button>
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <Text strong>Manuel giriş için anahtar:</Text>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0' }}>
              <Input 
                value={secret} 
                readOnly 
                style={{ maxWidth: 300, textAlign: 'center' }} 
                addonAfter={
                  <Tooltip title="Kopyala">
                    <CopyOutlined onClick={() => copyToClipboard(secret)} />
                  </Tooltip>
                }
              />
            </div>
          </div>
          
          <Divider />
          
          <div style={{ marginBottom: 20 }}>
            <Form layout="vertical" style={{ maxWidth: 300, margin: '0 auto' }}>
              <Form.Item
                label="Kimlik doğrulama uygulamanızdaki 6 haneli kodu girin"
                validateStatus={error ? 'error' : ''}
              >
                <Input 
                  prefix={<KeyOutlined />}
                  placeholder="123456" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  size="large"
                />
              </Form.Item>
            </Form>
          </div>
          
          <div style={{ marginTop: 20 }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                Geri
              </Button>
              <Button 
                type="primary" 
                onClick={verifyToken} 
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Doğrula ve Etkinleştir
              </Button>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: 'Yedek Kodlar',
      content: (
        <div style={{ textAlign: 'center' }}>
          <Result
            status="success"
            title="İki faktörlü kimlik doğrulama etkinleştirildi!"
            subTitle="Aşağıdaki yedek kodlarınızı güvenli bir yerde saklayın. Kimlik doğrulama uygulamanıza erişiminizi kaybetmeniz durumunda bu kodları kullanabilirsiniz."
          />
          
          <Card 
            title="Yedek Kodlarınız" 
            style={{ maxWidth: 500, margin: '0 auto 20px' }}
            extra={
              <Button 
                type="primary" 
                icon={<CopyOutlined />} 
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
              >
                Kopyala
              </Button>
            }
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '10px',
              textAlign: 'center'
            }}>
              {backupCodes.map((code, index) => (
                <Text key={index} strong copyable style={{ fontFamily: 'monospace' }}>
                  {code}
                </Text>
              ))}
            </div>
            
            <Divider />
            
            <Button 
              type="default" 
              block 
              onClick={downloadBackupCodes}
              icon={<LockOutlined />}
            >
              Yedek Kodları İndir
            </Button>
          </Card>
          
          <Alert
            message="Önemli Güvenlik Bilgisi"
            description="Her yedek kod yalnızca bir kez kullanılabilir. Bu kodları güvenli bir yerde saklayın ve kimseyle paylaşmayın."
            type="warning"
            showIcon
            style={{ maxWidth: 500, margin: '0 auto 20px' }}
          />
          
          <Button 
            type="primary" 
            onClick={() => navigate('/profile')}
          >
            Kullanıcı Profiline Dön
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SecurityScanOutlined style={{ fontSize: 24, marginRight: 10 }} />
            <span>İki Faktörlü Kimlik Doğrulama Kurulumu</span>
          </div>
        }
      >
        <Steps
          current={currentStep}
          items={[
            {
              title: 'Uygulama',
              icon: <QrcodeOutlined />,
            },
            {
              title: 'QR Kod',
              icon: <KeyOutlined />,
            },
            {
              title: 'Yedek Kodlar',
              icon: <LockOutlined />,
            },
          ]}
          style={{ marginBottom: 30 }}
        />
        
        {steps[currentStep].content}
      </Card>
    </div>
  );
};

export default TwoFactorSetupPage;
