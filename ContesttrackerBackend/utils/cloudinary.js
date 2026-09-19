import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadFileOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    console.log("Uploading file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // handles image, video, etc.
      folder: "users",       // optional: organize files in a folder
    });

    // console.log("File uploaded successfully:", response.url);

    // delete temp file after upload
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    // attempt to delete temp file safely
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    throw new Error("Cloudinary upload failed: " + error.message);
  }
};

export default uploadFileOnCloudinary ;