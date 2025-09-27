const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  resetAccessToken,
  changePassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getCurrentUser,
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
router.route("/reset-password").post(verifyJWT, changePassword);
router.route("/update-user").post(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-coverImage")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
module.exports = router;
