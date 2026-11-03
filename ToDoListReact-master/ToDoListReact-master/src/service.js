import axios from 'axios';

// כתובת השרת מוגדרת בקובץ .env (REACT_APP_API_URL)
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5064";

// מצרף את הטוקן לכל בקשה שיוצאת לשרת
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// תופס שגיאות ב-response, רושם ללוג, ובשגיאת 401 מעביר לדף לוגין
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response?.status, error.message);

    const path = window.location.pathname;
    if (error.response?.status === 401 && path !== "/login" && path !== "/register") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

const service = {
  register: async (username, password) => {
    const result = await axios.post('/register', { username, password });
    localStorage.setItem("token", result.data.token);
  },

  login: async (username, password) => {
    const result = await axios.post('/login', { username, password });
    localStorage.setItem("token", result.data.token);
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  isLoggedIn: () => !!localStorage.getItem("token"),

  getTasks: async () => {
    const result = await axios.get('/items');
    return result.data;
  },

  addTask: async (name) => {
    const result = await axios.post('/items', { name, isComplete: false });
    return result.data;
  },

  setCompleted: async (id, isComplete) => {
    await axios.put(`/items/${id}`, { isComplete });
    return {};
  },

  renameTask: async (id, name) => {
    await axios.put(`/items/${id}`, { name });
  },

  deleteTask: async (id) => {
    await axios.delete(`/items/${id}`);
  }
};

export default service;
