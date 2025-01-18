const Booking = require('../models/bookingModel');
const asyncHandler = require("express-async-handler");
const { Doctor } = require("../models/doctorModel");
const User = require('../models/userModel');

/**---------------------------------
 * @desc Book a doctor slot
 * @route POST /api/doctors/:doctorId/book
 * @access Public
 -----------------------------------*/
 module.exports.bookDoctorSlotCtrl = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { day, time } = req.body;
  const userId = req.user._id; 

  if (!day || !time) {
      return res.status(400).json({ message: "Day and time are required" });
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
  }


  const daySchedule = doctor.availability.find((schedule) => schedule.day === day);
  if (!daySchedule) {
      return res.status(400).json({ message: "No availability for the selected day" });
  }

  if (!daySchedule.hours.includes(time)) {
      return res.status(400).json({ message: "Time slot is not available" });
  }

  //remove the time by creating a new array and exluding the hours that are already booked
  daySchedule.hours = daySchedule.hours.filter((hour) => hour !== time);

  if (daySchedule.hours.length === 0) {
      doctor.availability = doctor.availability.filter((schedule) => schedule.day !== day);
  }

  await doctor.save();

  const newBooking = new Booking({
      doctorId,
      userId, 
      day,
      time,
      status: 'pending', 
      paymentStatus: 'unpaid',
  });

  await newBooking.save();

  res.status(200).json({ message: "Booking successful", bookedSlot: { day, time }, booking: newBooking });
});


/**---------------------------------
 * @desc Get available dates for a doctor
 * @route GET /api/doctors/:doctorId/availability
 * @access Public
 -----------------------------------*/
 module.exports.getDoctorAvailabilityCtrl = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId).select("availability");
  if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
  }

  const availableSlots = doctor.availability.map((schedule) => ({
      day: schedule.day,
      times: schedule.hours,
  }));

  res.status(200).json({ availableSlots });
});
//------------------------------------------------*
// @desc Get all bookings for admin (with user and doctor info)
// @route GET /api/bookings/admin
// @access Private (Admin only)
//------------------------------------------------*

module.exports.getAllBookingsForAdmin = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
      .populate('userId', 'name email') 
      .populate('doctorId', 'name specialization ') 
    

  // Check if there are bookings
  if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found." });
  }

  res.status(200).json({ bookings });
});

//------------------------------------------------*
// @desc Get all bookings for a specific user
// @route GET /api/bookings/user/:userId
// @access Private
//------------------------------------------------*

module.exports.getUserBookings = asyncHandler(async (req, res) => {
  const { userId } = req.params;


  const bookings = await Booking.find({ userId })
      .populate('doctorId', 'name specialization') 
      

  // Check if there are bookings
  if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user." });
  }

  res.status(200).json({ bookings });
});

//------------------------------------------------*
// @desc Get all bookings for a specific doctor
// @route GET /api/bookings/doctor/:doctorId
// @access Private
//------------------------------------------------*

module.exports.getDoctorBookings = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    const bookings = await Booking.find({ doctorId }).populate('userId', 'name email');
    if (bookings.length === 0) {
        return res.status(404).json({ message: "No bookings found for this doctor." });
    }

    res.status(200).json({ bookings });
});

//------------------------------------------------*
// @desc Update booking status and payment status
// @route PUT /api/bookings/:id
// @access Private (Admin or Doctor)
//------------------------------------------------*

module.exports.updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status || !paymentStatus) {
        return res.status(400).json({ message: "Status and payment status are required." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
    }

    booking.status = status;
    booking.paymentStatus = paymentStatus;

    await booking.save();
    res.status(200).json({ message: "Booking updated successfully", booking });
});
