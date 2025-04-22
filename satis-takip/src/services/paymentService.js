import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/payments`;

export const recordPayment = async (saleId, paymentData) => {
    const response = await axios.post(`${API_URL}/${saleId}`, paymentData);
    return response.data;
};

export const getPaymentDetails = async (saleId) => {
    const response = await axios.get(`${API_URL}/${saleId}`);
    return response.data;
};

export const updatePaymentDueDate = async (saleId, paymentId, dueDate) => {
    const response = await axios.put(`${API_URL}/${saleId}/due-date`, { paymentId, dueDate });
    return response.data;
};

export const getOverduePayments = async () => {
    const response = await axios.get(`${API_URL}/overdue`);
    return response.data;
};

export const recordBulkPayments = async (saleId, paymentsData) => {
    const response = await axios.post(`${API_URL}/${saleId}/bulk`, { payments: paymentsData });
    return response.data;
};

export const updatePaymentPlan = async (saleId, planData) => {
    const response = await axios.put(`${API_URL}/${saleId}/plan`, planData);
    return response.data;
};
