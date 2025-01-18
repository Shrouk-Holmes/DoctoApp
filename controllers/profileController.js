const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/userModel");
const photoUpload = require('../middlewares/photoUpload'); // Your multer setup
const { cloudinaryUploadImage, cloudinaryRemoveImage } = require('../utils/cloudinary');
const path = require('path');

/**---------------------------------
 * @desc    Get all users
 * @route   GET /api/users
 * @method  GET
 * @access  Private (Admin only)
 -----------------------------------*/
module.exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -otp -otpExpire -otpVerified -tokenVersion");
    const userCount = await User.countDocuments(); 

    res.status(200).json({
        success: true,
        totalUsers: userCount,
        users: users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            profilePhoto: user.profilePhoto,
        })),
    });
});

/**---------------------------------
 * @desc    Get a user profile by ID
 * @route   GET /api/users/:id
 * @method  GET
 * @access  Public
 -----------------------------------*/
module.exports.getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -otp -otpExpire -otpVerified -tokenVersion");
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
        success: true,
        user,
    });
});

/**---------------------------------
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @method  PUT
 * @access  Private (User or Admin)
 -----------------------------------*/
module.exports.updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    
    console.log("User ID:", id);
    console.log("Request Body:", req.body);
    
    // Find user by ID
    let user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate the request body
    const { error } = validateUpdateUser(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    // Update user details
    user = await User.findByIdAndUpdate(
        id,
        {
            $set: {
                username: username || user.username,
                email: email || user.email,
            },
        },
        { new: true, runValidators: true } // Return updated document and apply validators
    );

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
        },
    });
});

/**---------------------------------
 * @desc    Delete user by ID
 * @route   DELETE /api/users/:id
 * @method  DELETE
 * @access  Private (User or Admin)
 -----------------------------------*/
 module.exports.deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }


    // Delete the user using the User model
    await User.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});


/**-------------------------------
 * @desc UploadProfilePhoto
 * @route api/users/:id
 * @method PUT
 * @access private
---------------------------------*/
module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded!" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinaryUploadImage(req.file.path);
       

        if (!uploadResult || !uploadResult.secure_url) {
            return res.status(500).json({ message: "Image upload failed!" });
        }

        // Remove old photo
        if (user.profilePhoto.publicId) {
            await cloudinaryRemoveImage(user.profilePhoto.publicId);
        }

        // Update profile photo
        user.profilePhoto = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        };
        await user.save();

        res.status(200).json({
            message: "Profile photo updated successfully!",
            profilePhoto: user.profilePhoto,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while updating profile photo!" });
    }
});




module.exports.removePhoto = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            status: 'fail',
            message: 'User not found.',
        });
    }

    // Ensure the user has a photo to remove
    if (!user.profilePhoto || !user.profilePhoto.publicId) {
        return res.status(400).json({
            status: 'fail',
            message: 'No photo available to remove.',
        });
    }

    const publicId = user.profilePhoto.publicId;
    console.log("User's current photo publicId:", publicId);

    try {
        const result = await cloudinaryRemoveImage(publicId);

        if (result.result === 'ok' || result.result === 'not found') {
            user.profilePhoto.url = User.schema.path('profilePhoto.url').defaultValue;
            user.profilePhoto.publicId = null;

            // Save the updated user data
            await user.save();

            return res.status(200).json({
                status: 'success',
                message: 'Photo removed successfully, and default photo has been set.',
            });
        } else {
            return res.status(400).json({
                status: 'fail',
                message: 'Failed to remove photo from Cloudinary.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while trying to delete the photo.',
            error: error.message,
        });
    }
});
