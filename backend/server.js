const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");


const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/login', require('./routes/authRoutes'));
app.use('/api/exhibitions', require('./routes/exhibitions'));
app.use('/api/links', require('./routes/links'));


// Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));