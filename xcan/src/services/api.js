/*
Logic Description: Handles all API communication for the application.
Implementation Guideline: Use fetch or axios to make API requests. Centralize API endpoints and authentication logic here.
Design Description: (Not applicable for services)
Error Handling: Implement robust error handling for all API requests, including displaying informative error messages to the user.
*/

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
});

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/upload', formData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};

export const extractText = async (imageUrl) => {
  try {
    const response = await api.post('/extract', { imageUrl });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to extract text');
  }
};

export const summarizeText = async (text) => {
  try {
    const response = await api.post('/summarize', { text });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to summarize text');
  }
};