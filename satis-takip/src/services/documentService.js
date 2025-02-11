import axios from 'axios';

const API_URL = '/api/documents';

export const generatePaymentReceipt = async (paymentId) => {
    const response = await axios.get(`${API_URL}/payment-receipt/${paymentId}`, { responseType: 'blob' });
    return response.data;
};

export const generateSalesReport = async (filters) => {
    const response = await axios.post(`${API_URL}/sales-report`, filters, { responseType: 'blob' });
    return response.data;
};

export const exportToExcel = async (data, type) => {
    const response = await axios.post(`${API_URL}/excel-export`, { data, type }, { responseType: 'blob' });
    return response.data;
};

export const uploadCustomerDocument = async (customerId, file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await axios.post(`${API_URL}/customer/${customerId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getCustomerDocuments = async (customerId) => {
    const response = await axios.get(`${API_URL}/customer/${customerId}`);
    return response.data;
};
