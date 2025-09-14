const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const User = require("../models/user.models");
const uploadToCloudinary = require("../utils/Cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const registerUser = asyncHandler(async (req, res) => {
  //take input from req body
  const { username, fullname, email, password } = req.body;
  //check the input(should not empty)
  if (
    [username, fullname, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if the user already present or not

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with Username or Email already exists");
  }
  //check for image and avatar

  const avtarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;
  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload image on cloudinary
  const avtar = await uploadToCloudinary(avtarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadToCloudinary(coverImageLocalPath);
  }
  if (!avtar) {
    throw new ApiError(400, "Avatar file is required");
  }
  //create user object to create entry in database

  const user = await User.create({
    fullname,
    avatar: avtar,
    coverImage,
    email,
    password,
    username,
  });

  //return response

  const createdUser = await User.find(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  res
    .status(200)
    .json(ApiResponse(200, createdUser, "User registered Successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  res.send("Hi");
});

module.exports = { registerUser, getUser };
