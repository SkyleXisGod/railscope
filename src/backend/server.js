import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Frontend dev URL
app.use(cors({ origin: "http://localhost:5173" }));

const apiClient = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "X-API-Key": process.env.API_KEY
  }
});

// Endpoint proxy dla operacji
app.get("/api/operations", async (req, res) => {
  try {
    const response = await apiClient.get("/operations", {
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend działa na http://localhost:${PORT}`));