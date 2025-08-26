import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/references`;

export const getAllReferences = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createReference = async (referenceData) => {
  const response = await axios.post(API_URL, referenceData);
  return response.data;
};

export const updateReference = async (id, referenceData) => {
  const response = await axios.put(`${API_URL}/${id}`, referenceData);
  return response.data;
};

export const deleteReference = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};