import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Spin, Typography } from 'antd';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const { Title } = Typography;

const UserProfilePage = () => {
  const { user, updateUserInfo } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/auth/profile', values);
      
      if (response.data) {
        message.success('Kullanıcı bilgileri başarıyla güncellendi');
        updateUserInfo(response.data);
      }
    } catch (error) {
      message.error('Kullanıcı bilgileri güncellenirken bir hata oluştu');
      console.error('Güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      if (response.data) {
        message.success('Şifre başarıyla değiştirildi');
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu');
      console.error('Şifre değiştirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Kullanıcı Profili</Title>
      
      <Card title="Kişisel Bilgiler" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            fullName: user.fullName,
            username: user.username,
            email: user.email,
          }}
        >
          <Form.Item
            name="fullName"
            label="Ad Soyad"
            rules={[{ required: true, message: 'Lütfen adınızı ve soyadınızı girin' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="Kullanıcı Adı"
            rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'Lütfen e-posta adresinizi girin' },
              { type: 'email', message: 'Lütfen geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input />
          </Form.Item>
          
          <Button type="primary" htmlType="submit" loading={loading}>
            Bilgileri Güncelle
          </Button>
        </Form>
      </Card>
      
      <Card title="Şifre Değiştir">
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
          
          <Button type="primary" htmlType="submit" loading={loading}>
            Şifreyi Değiştir
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default UserProfilePage;
