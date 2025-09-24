const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const User = require("../models/user.models");
const { uploadToCloudinary } = require("../utils/Cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
const jwt = require("jsonwebtoken");
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

  const avtarLocalPath = req.files?.avatar?.[0]?.path;
  console.log("Avatar local path", req.file);
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload image on cloudinary
  const avtar = await uploadToCloudinary(avtarLocalPath);
  console.log("Avatar URL >>>>>>>>>>>>>>>>>>>>>>>>>", avtar.url);
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
    avatar: avtar.secure_url,
    coverImage: coverImage?.secure_url,
    email,
    password,
    username,
  });

  //return response

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Take username and password

  const { username, email, password } = req.body;

  // Check either or the username or email is required
  if (!(username || email)) {
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

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  console.log("Here>>>>>>>>>>>>", user);

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

  // res
  //   .status(200)
  //   .cookie("accessToken", accessToken, options)
  //   .cookie("refreshToken", refreshToken, options)
  //   .json(
  //     200,
  //     { user: loggedInUser.refreshToken, refreshToken },
  //     "User logged in Successfully"
  //   );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "User logged in successfully",
      user: loggedInUser,
      refreshToken,
    });
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

  // return res
  //   .status(200)
  //   .clearCookie("accessToken", options)
  //   .clearCookie("refreshToken", options);

  res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});

const getUser = asyncHandler(async (req, res) => {
  res.send("Hi");
});

const resetAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
});

module.exports = {
  registerUser,
  getUser,
  loginUser,
  logoutUser,
  resetAccessToken,
};
