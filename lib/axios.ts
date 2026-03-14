import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

//const BASE_URL = 'https://backtesting-production.up.railway.app';
const BASE_URL = "memesh-network-server-production.up.railway.app";


const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    const token = response.headers['set-cookie']?.toString();
    if (token && token.includes('jwt=')) {
      const jwtMatch = token.match(/jwt=([^;]+)/);
      if (jwtMatch) {
        SecureStore.setItemAsync('jwt', jwtMatch[1]);
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync('jwt');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;