const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  resetAccessToken,
} = require("../controllers/user");
const router = express.Router();
const { upload } = require("../middlewares/multer");
const { verifyJWT } = require("../middlewares/auth");

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(resetAccessToken);
module.exports = router;
