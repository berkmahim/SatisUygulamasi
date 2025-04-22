import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Select, Input, DatePicker, Button, Space, Tag, Spin } from 'antd';
import { SearchOutlined, ExportOutlined, FileSearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import locale from 'antd/es/date-picker/locale/tr_TR';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    type: '',
    user: '',
    dateRange: [],
    searchText: ''
  });
  const [users, setUsers] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);

  // Logları yükleme fonksiyonu
  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Filtre parametrelerini oluştur
      const params = {
        page,
        limit: pageSize,
        type: filters.type || undefined,
        userId: filters.user || undefined,
        searchText: filters.searchText || undefined,
      };

      // Tarih aralığı varsa ekle
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].startOf('day').toISOString();
        params.endDate = filters.dateRange[1].endOf('day').toISOString();
      }

      const response = await axios.get(`${BASE_URL}/api/logs`, { params });
      setLogs(response.data.logs);
      setPagination({
        ...pagination,
        current: page,
        pageSize,
        total: response.data.total
      });
    } catch (error) {
      console.error("Loglar yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı listesini yükle
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu:", error);
    }
  };

  // Aksiyon tiplerini yükle
  const fetchActionTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/types`);
      setActionTypes(response.data);
    } catch (error) {
      console.error("Aksiyon tipleri yüklenirken hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
    fetchActionTypes();
  }, []);

  // Tablo değiştiğinde fetch
  const handleTableChange = (pagination, filters, sorter) => {
    fetchLogs(pagination.current, pagination.pageSize);
  };

  // Filtre değiştiğinde fetch
  const applyFilters = () => {
    fetchLogs(1, pagination.pageSize);
  };

  // Filtre formunu temizle
  const clearFilters = () => {
    setFilters({
      type: '',
      user: '',
      dateRange: [],
      searchText: ''
    });
    fetchLogs(1, pagination.pageSize);
  };

  // Log seviyesine göre tag rengini belirle
  const getTagColorByType = (type) => {
    switch (type) {
      case 'sale':
        return 'green';
      case 'sale-cancel':
        return 'red';
      case 'payment':
        return 'blue';
      case 'project':
        return 'purple';
      case 'block':
        return 'orange';
      case 'user':
        return 'cyan';
      default:
        return 'default';
    }
  };

  // Türkçe işlem tipi adlandırması
  const getActionTypeName = (type) => {
    switch (type) {
      case 'sale':
        return 'Satış';
      case 'sale-cancel':
        return 'Satış İptal';
      case 'payment':
        return 'Ödeme';
      case 'project':
        return 'Proje';
      case 'block':
        return 'Birim';
      case 'user':
        return 'Kullanıcı';
      default:
        return type;
    }
  };

  // Logları Excel formatında dışa aktar
  const exportToExcel = async () => {
    try {
      const params = {
        type: filters.type || undefined,
        userId: filters.user || undefined,
        searchText: filters.searchText || undefined,
        export: true
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].startOf('day').toISOString();
        params.endDate = filters.dateRange[1].endOf('day').toISOString();
      }

      const response = await axios.get(`${BASE_URL}/api/logs/export`, { 
        params,
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `İşlem_Logları_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Dışa aktarma sırasında hata:", error);
    }
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => format(new Date(text), 'dd.MM.yyyy HH:mm:ss', { locale: tr }),
      width: 180,
    },
    {
      title: 'Kullanıcı',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user ? `${user.fullName || user.name}` : 'Bilinmeyen Kullanıcı',
      width: 180,
    },
    {
      title: 'İşlem Tipi',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getTagColorByType(type)}>{getActionTypeName(type)}</Tag>,
      width: 120,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>,
    },
    {
      title: 'İlgili ID',
      dataIndex: 'entityId',
      key: 'entityId',
      width: 180,
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={4}><FileSearchOutlined /> İşlem Logları</Title>
          <Button 
            icon={<ExportOutlined />} 
            type="primary" 
            onClick={exportToExcel}
          >
            Excel'e Aktar
          </Button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Space wrap>
            <Select
              placeholder="İşlem Tipi"
              style={{ width: 150 }}
              value={filters.type || undefined}
              onChange={(value) => setFilters({...filters, type: value})}
              allowClear
            >
              {actionTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>

            <Select
              placeholder="Kullanıcı"
              style={{ width: 200 }}
              value={filters.user || undefined}
              onChange={(value) => setFilters({...filters, user: value})}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {users.map(user => (
                <Option key={user._id} value={user._id}>{user.fullName || user.name}</Option>
              ))}
            </Select>

            <RangePicker 
              locale={locale}
              placeholder={['Başlangıç', 'Bitiş']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({...filters, dateRange: dates})}
            />

            <Input 
              placeholder="Açıklama ara" 
              value={filters.searchText}
              onChange={(e) => setFilters({...filters, searchText: e.target.value})}
              style={{ width: 200 }}
              allowClear
              prefix={<SearchOutlined />}
            />

            <Button type="primary" onClick={applyFilters}>Filtrele</Button>
            <Button onClick={clearFilters}>Temizle</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default ActivityLogs;
