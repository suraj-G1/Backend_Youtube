const cloudinary = require("cloudinary").v2;
const fs = require('fs')
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File has been uploaded to Cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlickSync(localFilePath);
    return null;
  }
};

module.exports = { uploadToCloudinary };
