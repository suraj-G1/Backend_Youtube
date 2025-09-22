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

const loginUser = asyncHandler(async (req, res) => {
  // Take username and password
  const { username, email, password } = req.body;

  // Check either or the username or email is required
  if (!username || !email) {
    throw new ApiError(400, "username or password is required");
  }

  // Check the user is present or not
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(400, "User is not registered");
  }
  // Check whether both are present or not
  // Validate the username
  // Validate the password

  const isPasswordValid = user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Give response

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      200,
      { user: loggedInUser.refreshToken, refreshToken },
      "User logged in Successfully"
    );
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res  
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options);
});

const getUser = asyncHandler(async (req, res) => {
  res.send("Hi");
});

module.exports = { registerUser, getUser, loginUser, logoutUser };
