import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api", // backend proxy
});

export default apiClient;