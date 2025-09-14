const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRoutes = require('./routes/user')

const app = express();

app.use(cors());

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.use("/api/v1/users",userRoutes)

module.exports = { app };
