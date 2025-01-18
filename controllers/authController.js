const asyncHandler = require("express-async-handler");
const argon2 = require("argon2");
const { User, validateRegisterUser, validateLoginUser, validateResetPassword } = require("../models/userModel");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");  


const loginLimiter = rateLimit({
  windowMs:  60 * 1000, 
  max: 5, 
  message: "Too many login attempts from this IP, please try again later.",
});

/**********************************
 * @desc Register User
 * @route api/auth/register
 * @method post
 * @access public
 *********************************/
module.exports.registerUserCtrl =  asyncHandler(async (req, res) => {
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { email, password, confirmPassword, username } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: "User already registered" });
  }

  // Hash the password with argon2
  const hashedPassword = await argon2.hash(password);

  user = new User({
    username,
    email,
    password: hashedPassword,
  });

  await user.save();
  res.status(201).json({ message: 'User registered successfully' });
});


/**********************************
 * @desc Login User
 * @route api/auth/login
 * @method post
 * @access public
 *********************************/
module.exports.loginUserCtrl = [loginLimiter, asyncHandler(async (req, res) => {
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password"); 

  if (!user || !(await argon2.verify(user.password, password))) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = user.generateAuthToken();
  res.status(200).json({
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
})];

// Forgot Password
/**********************************
 * @desc Forgot Password
 * @route api/auth/forgot-password
 * @method post
 * @access public
 *********************************/
module.exports.forgetPasswordCtrl = asyncHandler(async (req, res) => {
    try {
    const email = req.body.email;
  if (!email){
     return res.status(400).send({ message: "Please provide email" });
  }
  const user = await User.findOne({ email });
  if (!user){
     return res.status(400).send({ message: "User not found, please register" });
  }
  const otp = crypto.randomInt(1000, 9999);
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; 
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.MY_GMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const receiver = {
    from: "shrouk26529@gmail.com",
    to: email,
    subject: "Password Reset Request",
    text: `Your OTP is ${otp}. This OTP will expire in 10 minutes.`,
  };

  await transporter.sendMail(receiver);
  return res.status(200).send({ message: "OTP sent to your email" });
} catch (error) {
    console.error("Error in forgotPasswordCtrl:", error);
    return res.status(500).send({ message: "Something went wrong" });
  }
});

/**********************************
* @desc verify OTP
* @route api/auth/verify-otp
* @method post
* @access public
*********************************/
module.exports.verifyOtpCtrl = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).send({ message: "Please provide email and OTP" });
    }
  
    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }
  
    if (user.otp !== parseInt(otp)) {
      return res.status(400).send({ message: "Invalid OTP" });
    }
  
    if (user.otpExpire < Date.now()) {
      return res.status(400).send({ message: "OTP has expired" });
    }
  
    // OTP is valid, allow resetting password
    user.otpVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();
  
    return res.status(200).send({ message: "OTP verified, proceed to reset password" });
  });

/**********************************
 * @desc Reset Password
 * @route api/auth/reset-password
 * @method post
 * @access public
 *********************************/
module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  const { error } = validateResetPassword(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).send({ message: "Please provide email and new password" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send({ message: "User not found" });

  if (!user.otpVerified) return res.status(400).send({ message: "OTP verification required before resetting password" });

  // Hash the new password with argon2
  const hashedPassword = await argon2.hash(newPassword);

  user.password = hashedPassword;
  user.tokenVersion += 1;
  user.otpVerified = false;
  await user.save();

  return res.status(200).send({ message: "Password reset successfully" });
});

/**********************************************
 * @desc Change Password
 * @route api/auth/change-password
 * @method PUT
 * @access private (requires authentication)
 ************************************************/
module.exports.changePasswordCtrl = asyncHandler(async (req, res) => {
    // Validate the input data
    const { oldPassword, newPassword, confirmPassword } = req.body;
  
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please provide old password, new password, and confirm new password" });
    }
  
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirm password do not match" });
    }
  
    const user = await User.findById(req.user._id);
  
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const isOldPasswordValid = await argon2.verify(user.password, oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }
  
    const hashedNewPassword = await argon2.hash(newPassword);
  
    user.password = hashedNewPassword;
    user.tokenVersion += 1;
    await user.save();
  
    res.status(200).json({ message: "Password updated successfully" });
  });