import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

const api = {
  registerStep1: async (data) => {
    const res = await axios.post(`${API_URL}/register/step1`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  sendVerificationCode: async (email) => {
    const res = await axios.post(`${API_URL}/send-verification`, { email }, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  verifyEmail: async (data) => {
    const res = await axios.post(`${API_URL}/verify-email`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  registerStep2: async (userId, data) => {
    const res = await axios.post(`${API_URL}/register/step2/${userId}`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  login: async (data) => {
    const res = await axios.post(`${API_URL}/login`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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

  // Profile management
  updateProfile: async (userId, data) => {
    const res = await axios.post(`${API_URL}/profile/update/${userId}`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  changePassword: async (userId, data) => {
    const res = await axios.post(`${API_URL}/profile/change-password/${userId}`, data, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  logout: async () => {
    const res = await axios.post(`${API_URL}/logout`, {}, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  // Waste management
  getUserWasteSubmissions: async (userId) => {
    const res = await axios.get(`http://localhost:8080/api/waste/user/${userId}`, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  deleteWasteSubmission: async (wasteId) => {
    const res = await axios.delete(`http://localhost:8080/api/waste/${wasteId}`, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },

  updateWasteSubmission: async (wasteId, updates) => {
    const res = await axios.put(`http://localhost:8080/api/waste/${wasteId}/update`, updates, { 
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  },
};

export default api;
