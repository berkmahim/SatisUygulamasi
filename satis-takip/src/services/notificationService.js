import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/notifications`;

export const sendPaymentReminder = async (paymentId) => {
    const response = await axios.post(`${API_URL}/payment-reminder/${paymentId}`);
    return response.data;
};

export const getCustomerCommunicationHistory = async (customerId) => {
    const response = await axios.get(`${API_URL}/history/${customerId}`);
    return response.data;
};

export const addCustomerNote = async (customerId, note) => {
    const response = await axios.post(`${API_URL}/notes/${customerId}`, { note });
    return response.data;
};

export const getCustomerNotes = async (customerId) => {
    const response = await axios.get(`${API_URL}/notes/${customerId}`);
    return response.data;
};

export const updateNotificationPreferences = async (customerId, preferences) => {
    const response = await axios.put(`${API_URL}/preferences/${customerId}`, preferences);
    return response.data;
};
