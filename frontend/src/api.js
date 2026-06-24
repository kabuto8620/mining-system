import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default API;