import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/sales`;

export const createSale = async (saleData) => {
    const response = await axios.post(API_URL, saleData);
    return response.data;
};

export const getSaleById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const getSaleByBlockId = async (blockId) => {
    const response = await axios.get(`${API_URL}/block/${blockId}`);
    // Return the first active sale (backend returns array)
    const sales = response.data;
    return sales && sales.length > 0 ? sales[0] : null;
};

export const updatePaymentPlan = async (id, payments) => {
    const response = await axios.put(`${API_URL}/${id}/payment-plan`, { payments });
    return response.data;
};

export const recordPayment = async (saleId, paymentId, paymentData) => {
    const response = await axios.put(
        `${API_URL}/${saleId}/payments/${paymentId}`,
        paymentData
    );
    return response.data;
};

export const cancelSale = async (id) => {
    const response = await axios.put(`${API_URL}/${id}/cancel`);
    return response.data;
};

export const getSales = async (filters = {}) => {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
};

export const cancelSaleWithRefund = async (saleId, refundData) => {
    const response = await axios.post(`${API_URL}/${saleId}/cancel`, refundData);
    return response.data;
};

export const getCancelledSales = async () => {
    const response = await axios.get(`${API_URL}/cancelled`);
    return response.data;
};
