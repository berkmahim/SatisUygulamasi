import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Divider, List, Modal, Spin, message } from 'antd';
import { LockOutlined, KeyOutlined, SaveOutlined, CopyOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

const TwoFactorBackupCodesPage = () => {
  const [form] = Form.useForm();
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Eğer 2FA etkinleştirilmemişse, kullanıcı profil sayfasına yönlendir
    if (!user.twoFactorEnabled) {
      navigate('/profile');
      return;
    }

    // Yedek kodları getir
    fetchBackupCodes();
  }, [user, navigate]);

  const fetchBackupCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/auth/2fa/backup-codes');
      setBackupCodes(response.data.backupCodes);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Yedek kodlar yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async (values) => {
    setRegenerating(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/2fa/backup-codes', {
        password: values.password
      });
      setBackupCodes(response.data.backupCodes);
      setShowRegenerateModal(false);
      form.resetFields();
    } catch (error) {
      setError(error.response?.data?.message || 'Yedek kodlar oluşturulurken bir hata oluştu');
    } finally {
      setRegenerating(false);
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
                   backupCodes.map(code => code.used ? `${code.code} (KULLANILDI)` : code.code).join('\n') + 
                   '\n\nBu kodları güvenli bir yerde saklayın ve kimseyle paylaşmayın.';
    
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'satis-takip-yedek-kodlar.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <KeyOutlined style={{ fontSize: 24, marginRight: 10 }} />
            <span>Yedek Kodlarınız</span>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => setShowRegenerateModal(true)}
          >
            Yeni Kodlar Oluştur
          </Button>
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

        <Paragraph>
          Aşağıdaki yedek kodlar, kimlik doğrulama uygulamanıza erişiminizi kaybetmeniz durumunda 
          hesabınıza giriş yapmanızı sağlar. Her kod yalnızca bir kez kullanılabilir.
        </Paragraph>

        <Alert
          message="Önemli Güvenlik Bilgisi"
          description="Bu kodları güvenli bir yerde saklayın. Yazıcıdan çıktı alabilir veya şifreli bir not uygulamasında saklayabilirsiniz. Bu kodları kimseyle paylaşmayın."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={backupCodes}
              renderItem={code => (
                <List.Item>
                  <Card 
                    size="small" 
                    className={code.used ? "backup-code-used" : ""}
                    style={{ 
                      fontFamily: 'monospace', 
                      backgroundColor: code.used ? '#f5f5f5' : '#fff',
                      opacity: code.used ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong delete={code.used}>{code.code}</Text>
                      {code.used && <Text type="secondary">(Kullanıldı)</Text>}
                      {!code.used && (
                        <Button 
                          type="text" 
                          icon={<CopyOutlined />} 
                          onClick={() => copyToClipboard(code.code)}
                          size="small"
                        />
                      )}
                    </div>
                  </Card>
                </List.Item>
              )}
            />

            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/profile')}
              >
                Geri Dön
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={downloadBackupCodes}
              >
                Kodları İndir
              </Button>
              <Button 
                type="primary"
                onClick={() => navigate('/settings')}
                style={{ marginTop: 20 }}
              >
                Ayarlara Dön
              </Button>
            </div>
          </>
        )}
      </Card>

      <Modal
        title="Yedek Kodları Yenile"
        open={showRegenerateModal}
        onCancel={() => setShowRegenerateModal(false)}
        footer={null}
      >
        <Alert
          message="Uyarı: Bu işlem mevcut tüm yedek kodları geçersiz kılacaktır"
          description="Yeni kodlar oluşturulduğunda, eski yedek kodlar artık çalışmayacaktır. Yeni kodları güvenli bir yerde saklamayı unutmayın."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={regenerateBackupCodes}
        >
          <Form.Item
            name="password"
            label="Şifrenizi Doğrulayın"
            rules={[
              { required: true, message: 'Lütfen şifrenizi girin' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Şifreniz"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'end' }}>
              <Button onClick={() => setShowRegenerateModal(false)}>
                İptal
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={regenerating}
                danger
              >
                Yedek Kodları Yenile
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TwoFactorBackupCodesPage;
