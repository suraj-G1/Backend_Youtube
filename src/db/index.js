const { DB_NAME } = require("../constants");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config()
const dbConnect = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error while connecting database", error);
    process.exit(1);
  }
};

module.exports = { dbConnect };
