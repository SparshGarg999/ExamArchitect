// Central API base URL configuration.
// In production (Vercel/Render), set VITE_API_BASE in your environment variables.
// Locally, it defaults to http://localhost:8000.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
