import axios from 'axios';
const instance = axios.create({
    baseURL: "https://contest-tracker-for-coding-platforms-1.onrender.com",
    withCredentials: true
});
export default instance;