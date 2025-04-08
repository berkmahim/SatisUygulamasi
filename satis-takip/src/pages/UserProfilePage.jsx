import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Spin, Typography, Row, Col } from 'antd';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { EditOutlined, SaveOutlined, CloseOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const UserProfilePage = () => {
  const { user, updateUserInfo } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        username: user.username,
        email: user.email
      });
    }
  }, [user, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.put('/api/users/update-profile', values);
      updateUserInfo(response.data);
      message.success('Profil başarıyla güncellendi');
    } catch (error) {
      message.error(error.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ fontSize: '18px', marginRight: '8px' }} />
            <span>Kullanıcı Bilgileri</span>
          </div>
        }
      >
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
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="Kullanıcı Adı"
            rules={[{ required: true, message: 'Lütfen kullanıcı adınızı girin' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: 'Lütfen e-posta adresinizi girin' },
              { type: 'email', message: 'Lütfen geçerli bir e-posta adresi girin' }
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              Bilgileri Güncelle
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserProfilePage;
