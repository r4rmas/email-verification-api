const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
require("dotenv/config");

const app = express();
app.use(express.json());
app.use(cors());
app.use(routes);

mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Connected to database")
);

app.listen(8000, () => console.log("Listening at http://localhost:8000"));
