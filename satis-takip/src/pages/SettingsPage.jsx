import React, { useState } from 'react';
import { Card, Tabs, Typography, Form, Input, Button, message, Alert, Divider, Space } from 'antd';
import { 
  UserOutlined, 
  SecurityScanOutlined, 
  SettingOutlined, 
  LockOutlined,
  KeyOutlined
} from '@ant-design/icons';
import UserProfilePage from './UserProfilePage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const SettingsPage = () => {
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/users/update-password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Şifre başarıyla güncellendi');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Şifre güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Ayarlar</Title>
      
      {!user.twoFactorEnabled && (
        <Alert
          message="İki Faktörlü Kimlik Doğrulama Zorunlu"
          description="Sistemi kullanabilmek için iki faktörlü kimlik doğrulamayı etkinleştirmeniz gerekmektedir. Etkinleştirme işlemini tamamlayana kadar diğer sayfalara erişim kısıtlanacaktır."
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
          action={
            <Button 
              type="primary" 
              size="small" 
              onClick={() => navigate('/two-factor/setup')}
            >
              Hemen Etkinleştir
            </Button>
          }
        />
      )}
      
      <Card>
        <Tabs defaultActiveKey="profile" type="card">
          <TabPane 
            tab={
              <span>
                <UserOutlined /> Profil
              </span>
            } 
            key="profile"
          >
            <UserProfilePage />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <SecurityScanOutlined /> Güvenlik
              </span>
            } 
            key="security"
          >
            <div style={{ padding: '20px' }}>
              <Title level={4}>Güvenlik Ayarları</Title>
              
              <Card style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: '20px' }}>
                  <Title level={5}>İki Faktörlü Kimlik Doğrulama</Title>
                  <Paragraph>
                    {user?.twoFactorEnabled 
                      ? 'İki faktörlü kimlik doğrulama aktif. Bu, hesabınızı daha güvenli hale getirir.'
                      : 'İki faktörlü kimlik doğrulama aktif değil. Hesap güvenliğinizi artırmak için etkinleştirin.'}
                  </Paragraph>
                  
                  {user?.twoFactorEnabled ? (
                    <Button 
                      type="danger" 
                      onClick={() => navigate('/settings')}
                      icon={<LockOutlined />}
                    >
                      2FA Zaten Devrede
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/two-factor/setup')}
                      icon={<SecurityScanOutlined />}
                    >
                      2FA'yı Etkinleştir
                    </Button>
                  )}
                </div>
                
                {user?.twoFactorEnabled && (
                  <div>
                    <Title level={5}>Yedek Kodlar</Title>
                    <Paragraph>
                      Kimlik doğrulama uygulamanıza erişemezseniz, hesabınıza giriş yapmak için yedek kodlara ihtiyacınız olacak.
                    </Paragraph>
                    <Button 
                      onClick={() => navigate('/two-factor/backup-codes')}
                    >
                      Yedek Kodları Yönet
                    </Button>
                  </div>
                )}
              </Card>

              <Card>
                <Title level={5}>Şifre Değiştir</Title>
                <Paragraph>
                  Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirmeniz önerilir.
                </Paragraph>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Mevcut Şifre"
                    rules={[{ required: true, message: 'Lütfen mevcut şifrenizi girin' }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  
                  <Form.Item
                    name="newPassword"
                    label="Yeni Şifre"
                    rules={[
                      { required: true, message: 'Lütfen yeni şifrenizi girin' },
                      { min: 6, message: 'Şifre en az 6 karakter olmalıdır' }
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  
                  <Form.Item
                    name="confirmPassword"
                    label="Yeni Şifreyi Tekrar Girin"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Lütfen yeni şifrenizi tekrar girin' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('İki şifre eşleşmiyor'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  
                  <Button type="primary" htmlType="submit" loading={loading} icon={<LockOutlined />}>
                    Şifre Değiştir
                  </Button>
                </Form>
              </Card>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <SettingOutlined /> Sistem
              </span>
            } 
            key="system"
          >
            <div style={{ padding: '20px' }}>
              <Title level={4}>Sistem Ayarları</Title>
              <p>Bu bölüm geliştiriliyor...</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
