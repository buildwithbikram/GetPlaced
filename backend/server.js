const express = require('express');
const cors = require('cors');


const PORT = 5000;

const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("GetPlaced Backend is running!");
});
app.get('/api/health', (req, res)=>{
    res.json({
        success: true,
        message: 'GetPlaced API is working'
    });
});

app.listen(PORT, ()=>{
    console.log(`GetPlaced backend running on port ${PORT}`);
});