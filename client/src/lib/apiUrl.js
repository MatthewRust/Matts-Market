// API base URL helper - use this for direct axios calls outside of the api client
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:8080/api";
};

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:8080";
};
