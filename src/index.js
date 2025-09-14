const { dbConnect } = require("./db");
const dotenv = require("dotenv");
const {app} = require('./app')
dotenv.config();

dbConnect()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App is up and running at port : ${process.env.PORT}`);
    });

    app.get("/", (req, res) => {
      res.send("Hi");
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection failed !!!", err);
  });
