const express = require('express');
const router = express.Router();
const {
    
    getUserBookings,
    getDoctorBookings,
    updateBookingStatus,
    getDoctorAvailabilityCtrl,
    bookDoctorSlotCtrl,
    getAllBookingsForAdmin,
} = require('../controllers/bookingController');
const { verifyTokenAndAdmin,verifyTokenOnlyUser, verifyToken,verifyTokenAndAuth} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");

router.get("/available/:doctorId",verifyToken, validateObjectId,getDoctorAvailabilityCtrl);
router.post("/:doctorId", verifyToken, validateObjectId,bookDoctorSlotCtrl);  
router.get("/admin", verifyTokenAndAdmin, getAllBookingsForAdmin);  
router.get("/user/:userId", verifyToken,validateObjectId, getUserBookings);  
router.get("/doctor/:doctorId", verifyToken,validateObjectId, getDoctorBookings);  
router.put("/:id", verifyTokenAndAdmin,validateObjectId, updateBookingStatus);  

module.exports = router;
