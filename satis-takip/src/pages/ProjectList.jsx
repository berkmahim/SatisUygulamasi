import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal, Form, Input, Space, Row, Col, Typography, message, Popconfirm, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { uploadImage } from '../utils/cloudinary';

const BASE_URL = import.meta.env.VITE_API_URL;

const { Title } = Typography;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`);
      setProjects(response.data);
    } catch (error) {
      message.error('Projeler yüklenirken bir hata oluştu');
    }
  };

  const showModal = (project = null) => {
    setEditingProject(project);
    if (project) {
      form.setFieldsValue(project);
      setUploadedImageUrl(project.backgroundImage || '');
    } else {
      form.resetFields();
      setUploadedImageUrl('');
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingProject(null);
    form.resetFields();
    setUploadedImageUrl('');
  };

  const handleSubmit = async (values) => {
    try {
      // Arkaplan resmi URL'sini ekle
      const projectData = {
        ...values,
        backgroundImage: uploadedImageUrl
      };

      if (editingProject) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${editingProject._id}`, projectData);
        message.success('Proje başarıyla güncellendi');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/projects`, projectData);
        message.success('Proje başarıyla oluşturuldu');
      }
      fetchProjects();
      handleCancel();
    } catch (error) {
      message.error('Proje kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${id}`);
      message.success('Proje başarıyla silindi');
      fetchProjects();
    } catch (error) {
      message.error('Proje silinirken bir hata oluştu');
    }
  };

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    
    try {
      const imageUrl = await uploadImage(file);
      setUploadedImageUrl(imageUrl);
      onSuccess('ok');
      message.success('Resim başarıyla yüklendi');
    } catch (error) {
      onError(error);
      message.error('Resim yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Arkaplan Resmi Yükle</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Projeler</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Yeni Proje Ekle
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {projects.map(project => (
          <Col xs={24} sm={12} md={8} lg={6} key={project._id}>
            <Card
              hoverable
              onClick={() => window.location.href = `/projects/${project._id}`}
              style={{ cursor: 'pointer' }}
              cover={
                project.backgroundImage && project.backgroundImage.trim() !== '' ? (
                  <div 
                    style={{ 
                      height: 200, 
                      backgroundImage: `url(${project.backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} 
                  />
                ) : (
                  <div style={{ height: 200, backgroundColor: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ color: '#bfbfbf' }}>Resim Yok</span>
                  </div>
                )
              }
              actions={[
                <Link to={`/projects/${project._id}`} key="view" onClick={e => e.stopPropagation()}>
                  <EyeOutlined />
                </Link>,
                <EditOutlined key="edit" onClick={(e) => {
                  e.stopPropagation();
                  showModal(project);
                }} />,
                <Popconfirm
                  title="Bu projeyi silmek istediğinizden emin misiniz?"
                  onConfirm={() => handleDelete(project._id)}
                  okText="Evet"
                  cancelText="Hayır"
                  onPopupClick={e => e.stopPropagation()}
                >
                  <DeleteOutlined key="delete" onClick={e => e.stopPropagation()} />
                </Popconfirm>
              ]}
            >
              <Card.Meta
                title={project.name}
                description={
                  <Space direction="vertical">
                    <div>{project.location}</div>
                    <div>{project.description}</div>
                  </Space>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Proje Adı"
            rules={[{ required: true, message: 'Lütfen proje adını girin' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="location"
            label="Konum"
            rules={[{ required: true, message: 'Lütfen konumu girin' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Açıklama"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item label="Arkaplan Resmi">
            <Upload
              name="backgroundImage"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={handleImageUpload}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('Sadece resim dosyaları yükleyebilirsiniz!');
                }
                return isImage;
              }}
            >
              {uploadedImageUrl ? (
                <div style={{ 
                  width: '100%', 
                  height: '100%',
                  backgroundImage: `url(${uploadedImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
              ) : uploadButton}
            </Upload>
            {uploadedImageUrl && (
              <Button 
                onClick={() => setUploadedImageUrl('')}
                style={{ marginTop: 10 }}
                danger
              >
                Resmi Kaldır
              </Button>
            )}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                {editingProject ? 'Güncelle' : 'Oluştur'}
              </Button>
              <Button onClick={handleCancel}>İptal</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList;
