// API Service: Handles all backend communication for ideas
// - Uses Axios with a base URL
// - Provides functions to get all ideas, get an idea by ID, and add a new idea
// - Logs errors to console for easy debugging

import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});


// Fetch all ideas (GET)
export const getIdeas = async () => {
  try {
    const response = await api.get("/ideas");
    return response.data.ideas || [];
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return [];
  }
};



// Add a new idea (POST)
export const addIdea = async (ideaData) => {
  try {
    const response = await api.post("/ideas", ideaData);
    return response.data; // returns created idea data
  } catch (error) {
    console.error("Error adding idea:", error);
    return null;
  }
};

export default api;
