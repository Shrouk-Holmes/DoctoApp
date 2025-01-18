const express = require("express");
const {
    registerUserCtrl,
    loginUserCtrl,
    forgetPasswordCtrl,
    verifyOtpCtrl,
    resetPasswordCtrl,
    changePasswordCtrl,
} = require("../controllers/authController");
const {
    verifyToken,
} = require("../middlewares/verifyToken");

const router = express.Router();


router.route("/register").post(registerUserCtrl);
router.route("/login").post(loginUserCtrl);
router.route("/forgot-password").post(forgetPasswordCtrl);
router.route("/verify-otp").post(verifyOtpCtrl);
router.route("/reset-password").post(resetPasswordCtrl);
router.route("/change-password").post(verifyToken, changePasswordCtrl);

module.exports = router;