const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 100,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        otp: {
            type: Number,
            minlength: 4,
            maxlength: 4,
            default: null,
        },
        otpExpire: {
            type: Date,
            default: null,
        },
        otpVerified: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        }, tokenVersion: {
            type: Number,
            default: 0 
        },profilePhoto: {
            url: {
                type: String,
                required: true,
                default: 'https://cdn.pixabay.com/photo/2017/02/25/22/04/user-icon-2098873_1280.png',
            },
            publicId: {
                type: String,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { _id: this._id, isAdmin: this.isAdmin, tokenVersion: this.tokenVersion },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d', 
            algorithm: 'HS256'
        }
    );
};



// Hash password
UserSchema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Compare passwords
UserSchema.statics.comparePassword = async function (inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
};

const User = mongoose.model('User', UserSchema);

// Validation Functions
const validateRegisterUser = (obj) => {
    const schema = Joi.object({
        username: Joi.string().trim().min(2).max(100).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().trim().min(8).required(),
        confirmPassword: Joi.any().valid(Joi.ref('password')).required(),
    });
    return schema.validate(obj);
};

const validateLoginUser = (obj) => {
    const schema = Joi.object({
        email: Joi.string().trim().email().required(),
        password: Joi.string().trim().min(8).required(),
    });
    return schema.validate(obj);
};

const validateResetPassword = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        newPassword: Joi.string().min(8).required(),
    });
    return schema.validate(data);
};

const validateUpdateUser = (obj) => {
    const schema = Joi.object({
        username: Joi.string().trim().min(2).max(100),
        email: Joi.string().trim().email(),
        password: Joi.string().trim().min(8),
    });
    return schema.validate(obj);
};

module.exports = {
    User,
    validateLoginUser,
    validateRegisterUser,
    validateResetPassword,
    validateUpdateUser,
};
