const express = require("express");
const { registerUser, getUser } = require("../controllers/user");
const router = express.Router();
const upload = require("../middlewares/multer");

router
  .route("/register")
  .post(
    upload.upload.fields(
      { name: "avatar", maxCount: 1 },
      { name: "coverImage", maxCount: 1 }
    ),
    registerUser
  );

router.route("/register").get(getUser);

module.exports = router;
