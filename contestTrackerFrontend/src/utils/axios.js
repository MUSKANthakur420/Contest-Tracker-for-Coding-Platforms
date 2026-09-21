import axios from 'axios';

const instance = axios.create({
    baseURL: "https://contest-tracker-for-coding-platforms-1.onrender.com",
    withCredentials: true
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default instance;