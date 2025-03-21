const express = require('express');
const cors = require('cors'); 
require('dotenv').config();
const emailRoutes = require('./routes/Route'); 

const app = express();
app.use(express.json()); 
app.use(cors()); 

app.use('/api/emails', emailRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
