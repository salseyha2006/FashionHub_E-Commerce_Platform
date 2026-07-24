// src/server.js
// Entry point for running the app as a live server (not used by tests).
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
