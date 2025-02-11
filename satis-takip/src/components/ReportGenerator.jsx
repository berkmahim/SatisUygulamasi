import React, { useState } from 'react';
import { Card, Form, Select, DatePicker, Button, Space, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { exportReport } from '../services/reportService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportGenerator = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const reportTypes = [
        { value: 'sales', label: 'Satış Raporu' },
        { value: 'payments', label: 'Ödeme Raporu' },
        { value: 'customers', label: 'Müşteri Raporu' },
        { value: 'financial', label: 'Finansal Rapor' },
        { value: 'overdue', label: 'Gecikmiş Ödemeler' }
    ];

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            
            const filters = {
                ...values,
                dateRange: values.dateRange ? {
                    start: values.dateRange[0].format('YYYY-MM-DD'),
                    end: values.dateRange[1].format('YYYY-MM-DD')
                } : undefined
            };

            const blob = await exportReport(values.reportType, filters, format);
            
            // Dosyayı indir
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rapor_${values.reportType}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            message.success('Rapor başarıyla oluşturuldu');
        } catch (error) {
            message.error('Rapor oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Rapor Oluştur">
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    reportType: 'sales'
                }}
            >
                <Form.Item
                    name="reportType"
                    label="Rapor Türü"
                    rules={[{ required: true, message: 'Lütfen rapor türü seçin' }]}
                >
                    <Select>
                        {reportTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                {type.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="dateRange"
                    label="Tarih Aralığı"
                >
                    <RangePicker 
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                    />
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={() => handleExport('pdf')}
                            loading={loading}
                        >
                            PDF İndir
                        </Button>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={() => handleExport('xlsx')}
                            loading={loading}
                        >
                            Excel İndir
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default ReportGenerator;
