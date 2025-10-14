import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

const api = {
  registerStep1: async (data) => {
    const res = await axios.post(`${API_URL}/register/step1`, data, { withCredentials: true });
    return res.data;
  },

  registerStep2: async (userId, data) => {
    const res = await axios.post(`${API_URL}/register/step2/${userId}`, data, { withCredentials: true });
    return res.data;
  },

  login: async (data) => {
    const res = await axios.post(`${API_URL}/login`, data, { withCredentials: true });
    return res.data; // backend returns full user object
  },

  getCurrentUser: async () => {
    try {
      const res = await axios.get(`${API_URL}/check`, { withCredentials: true });
      return res.data || null;
    } catch (e) {
      return null;
    }
  },
};

export default api;
