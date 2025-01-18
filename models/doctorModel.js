const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const DoctorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        specialization: {
            type: String,
            required: true,
            trim: true,
        },
        experience: {
            type: Number,
            required: true,
            min: 0,
        },
        qualifications: {
            type: [String],
            required: true,
        },
        availability: [
            {
                day: {
                    type: String,
                    required: true,
                },
                hours: [
                    {
                        type: String,
                        required: true, 
                    },
                ],
            },
        ],
        fee: {
            type: Number,
            required: true,
            min: 0,
        },
        addresses: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Validation
const validateDoctor = (doctor) => {
    const schema = Joi.object({
        name: Joi.string().trim().required(),
        email: Joi.string()
            .trim()
            .email({ tlds: { allow: false } })
            .required(),
        password: Joi.string().min(6).required(),
        specialization: Joi.string().trim().required(),
        experience: Joi.number().min(0).required(),
        qualifications: Joi.array().items(Joi.string().trim()).required(),
        availability: Joi.array()
            .items(
                Joi.object({
                    day: Joi.string().required(),
                    hours: Joi.array().items(Joi.string().required()).required(),
                })
            )
            .required(),
        fee: Joi.number().min(0).required(),
        addresses: Joi.array().items(Joi.string().trim().required()),
    });
    return schema.validate(doctor);
};

const Doctor = mongoose.model('Doctor', DoctorSchema);

module.exports = { Doctor, validateDoctor };
