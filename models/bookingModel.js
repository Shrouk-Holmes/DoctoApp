const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    day: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        default: 'unpaid',
    },
}, {
    timestamps: true,
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
