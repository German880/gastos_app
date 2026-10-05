const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//Middelwares
app.use(cors())
app.use(helmet())
app.use(express.json())





app.listen(PORT, () => {
    console.log(`servidor activo en http://localhost:${PORT}`)
});