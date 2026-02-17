import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 5000
});

export async function getOperations() {
  try {
    const response = await apiClient.get("/operations", {
      params: {
        carriersInclude: "IC",
        fullRoutes: true,
        withPlanned: true,
        pageSize: 100
      }
    });

    console.log("SUROWE RESPONSE:", response.data); 
    return response.data.trains; 
  } catch (err) {
    console.error("Błąd pobierania operacji:", err);
    return [];
  }
}