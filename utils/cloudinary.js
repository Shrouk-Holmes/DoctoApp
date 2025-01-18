const cloudinary = require('cloudinary');
require('dotenv').config();
// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image to Cloudinary
const cloudinaryUploadImage = async (fileToUpload) => {
    try {
        const data = await cloudinary.uploader.upload(fileToUpload, {
            resource_type: 'auto',
        });
        return data;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null; // Return null to indicate failure
    }
};

// Remove a single image from Cloudinary
const cloudinaryRemoveImage = async (imagePublicId) => {
    try {
        const result = await cloudinary.uploader.destroy(imagePublicId);
        return result;
    } catch (error) {
        return error;
    }
};


module.exports = {
    cloudinaryUploadImage,
    cloudinaryRemoveImage,
};
