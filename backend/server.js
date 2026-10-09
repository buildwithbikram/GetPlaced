require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');

const PORT = 5000;

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
    res.send("GetPlaced Backend is running!");
});
app.get('/api/health', (req, res)=>{
    res.json({
        success: true,
        message: 'GetPlaced API is working'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);

app.listen(PORT, ()=>{
    console.log(`GetPlaced backend running on port ${PORT}`);
});