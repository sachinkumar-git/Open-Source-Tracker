require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB (Required)
connectDB();

const app = express();

// Init Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/repos', require('./routes/repoRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/compiler', require('./routes/compilerRoutes'));

const PORT = process.env.PORT || 5000;

// Force listen in development to keep process alive
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
