import { v2 as cloudinary } from 'cloudinary';
import executeWithRetry from './executeWithRetry.js';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadonCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;

    const response = await executeWithRetry(
      () => cloudinary.uploader.upload(localpath, { resource_type: 'auto' }),
      { retries: 3, delay: 1000, exponential: false }
    );    
    fs.unlinkSync(localpath);
    return response;
  } catch (err) {
    if (fs.existsSync(localpath)) fs.unlinkSync(localpath);
    console.error('Error while uploading file to Cloudinary:', err);
    return null;
  }
};

export default uploadonCloudinary;
