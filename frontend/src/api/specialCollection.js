import axios from "axios";

const API_URL = "http://localhost:8081/api/special-collection";

const scApi = {
  calculateFee: async (data) => {
    const res = await axios.post(`${API_URL}/fee`, data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },
  getDates: async () => {
    const res = await axios.get(`${API_URL}/dates`, { withCredentials: true });
    return res.data;
  },
  getSlots: async (date) => {
    const res = await axios.get(`${API_URL}/slots`, { params: { date }, withCredentials: true });
    return res.data;
  },
  schedule: async (payload) => {
    const res = await axios.post(`${API_URL}/schedule`, payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },
  listMine: async () => {
    const res = await axios.get(`${API_URL}/mine`, { withCredentials: true });
    return res.data;
  },
  reschedule: async (id, payload) => {
    const res = await axios.post(`${API_URL}/reschedule/${id}`, payload, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },
  pay: async (id) => {
    const res = await axios.post(`${API_URL}/pay/${id}`, {}, { withCredentials: true });
    return res.data;
  },
  payWithMethod: async (id, method, success = true) => {
    const res = await axios.post(`${API_URL}/pay/${id}`, { method, success }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },
  downloadReceipt: async (id) => {
    const res = await axios.get(`${API_URL}/receipt/${id}`, { withCredentials: true, responseType: 'blob' });
    return res;
  },
  cancel: async (id) => {
    const res = await axios.post(`${API_URL}/cancel/${id}`, {}, { withCredentials: true });
    return res.data;
  }
};

export default scApi;


