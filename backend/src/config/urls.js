// Where the React app is served. Used for CORS and for every link or redirect
// that sends the browser back to the UI. The default matches `make dev` (vite).
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

module.exports = { FRONTEND_URL };
