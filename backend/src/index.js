const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth.routes');

//Middelwares
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use('/api/auth', authRoutes);




app.listen(PORT, () => {
    console.log(`servidor activo en http://localhost:${PORT}`)
});