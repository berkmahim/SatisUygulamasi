import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Button, message } from 'antd';
import { cancelSaleWithRefund } from '../services/saleService';
import moment from 'moment';

const CancelSaleModal = ({ visible, onCancel, saleId, onSuccess }) => {
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        try {
            const refundData = {
                ...values,
                refundDate: values.refundDate.format('YYYY-MM-DD')
            };

            await cancelSaleWithRefund(saleId, refundData);
            message.success('Satış başarıyla iptal edildi ve iade işlemi kaydedildi');
            form.resetFields();
            onSuccess();
        } catch (error) {
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Satış iptal edilirken bir hata oluştu');
            }
        }
    };

    return (
        <Modal
            title="Satış İptali ve İade"
            visible={visible}
            onCancel={onCancel}
            footer={null}
        >
            <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                initialValues={{
                    refundDate: moment()
                }}
            >
                <Form.Item
                    name="refundAmount"
                    label="İade Tutarı"
                    rules={[{ required: true, message: 'Lütfen iade tutarını giriniz' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `₺ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/₺\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <Form.Item
                    name="refundReason"
                    label="İptal Nedeni"
                    rules={[{ required: true, message: 'Lütfen iptal nedenini giriniz' }]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item
                    name="refundDate"
                    label="İade Tarihi"
                    rules={[{ required: true, message: 'Lütfen iade tarihini seçiniz' }]}
                >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        İade İşlemini Tamamla
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CancelSaleModal;
