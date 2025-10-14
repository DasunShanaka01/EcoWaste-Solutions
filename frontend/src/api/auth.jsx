// src/Services/api.jsx
import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

const api = {
  // Step 1: Register (Name + Phone)
  registerStep1: async (data) => {
    const res = await axios.post(`${API_URL}/register/step1`, data);
    return res.data;
  },

  // Step 2: Register (Email + Password)
  registerStep2: async (userId, data) => {
    const res = await axios.post(`${API_URL}/register/step2/${userId}`, data);
    return res.data;
  },

  // Login
  login: async (data) => {
    const res = await axios.post(`${API_URL}/login`, data, { withCredentials: true });
    return res.data;
  },
};

export default api;
