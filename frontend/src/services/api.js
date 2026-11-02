import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
          || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (!baseURL) {
          throw new Error('VITE_API_URL must be configured for production builds.');
}

const api = axios.create({
          baseURL,
});

// if req , sent token in localstorage
api.interceptors.request.use((config) => {
          const token = localStorage.getItem('token');
          
          if(token) {
                    config.headers.Authorization = `Bearer ${token}`;
          }

          return config;
});

export default api;