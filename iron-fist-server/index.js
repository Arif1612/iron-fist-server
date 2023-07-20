require("dotenv").config();
const express = require('express');
const app = express();
const cors = require('express');
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
    res.send('iron fist is running');
})

app.listen(port, () => {
    console.log(`Iron Fist on Port ${port}`)
})