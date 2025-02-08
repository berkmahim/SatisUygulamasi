import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal, Form, Input, Space, Row, Col, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (error) {
      message.error('Projeler yüklenirken bir hata oluştu');
    }
  };

  const showModal = (project = null) => {
    setEditingProject(project);
    if (project) {
      form.setFieldsValue(project);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProject) {
        await axios.put(`http://localhost:5000/api/projects/${editingProject._id}`, values);
        message.success('Proje başarıyla güncellendi');
      } else {
        await axios.post('http://localhost:5000/api/projects', values);
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
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      message.success('Proje başarıyla silindi');
      fetchProjects();
    } catch (error) {
      message.error('Proje silinirken bir hata oluştu');
    }
  };

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
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
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
