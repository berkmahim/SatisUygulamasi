import axios from 'axios';

const API_URL = 'http://localhost:5000/api/blocks';

export const getAllBlocks = async (projectId) => {
  const response = await axios.get(`${API_URL}/${projectId}`);
  return response.data;
};

export const createBlock = async (projectId, blockData) => {
  const response = await axios.post(`${API_URL}/${projectId}`, blockData);
  return response.data;
};

export const updateBlock = async (id, blockData) => {
  const response = await axios.patch(`${API_URL}/${id}`, blockData);
  return response.data;
};

export const deleteBlock = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const getBlockById = async (id) => {
  const response = await axios.get(`${API_URL}/detail/${id}`);
  return response.data;
};
