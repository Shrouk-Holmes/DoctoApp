const asyncHandler = require("express-async-handler");
const { Doctor, validateDoctor } = require("../models/doctorModel");
const bcrypt = require('bcryptjs');

/**********************************
 * @desc Add New Doctor
 * @route api/doctors
 * @method post
 * @access private (Admin only)
 *********************************/
module.exports.addDoctorCtrl = asyncHandler(async (req, res) => {
  const { error } = validateDoctor(req.body);
  if (error) {
      return res.status(400).json({ message: error.details[0].message });
  }

  const existingDoctor = await Doctor.findOne({ email: req.body.email });
  if (existingDoctor) {
      return res.status(400).json({ message: "Doctor with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const doctor = new Doctor({
      userId: req.user._id,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      specialization: req.body.specialization,
      experience: req.body.experience,
      qualifications: req.body.qualifications,
      availability: req.body.availability, 
      fee: req.body.fee,
      addresses: req.body.addresses,
  });

  // Save the doctor to the database
  await doctor.save();
  res.status(201).json({ message: "Doctor added successfully", doctor });
});

/**********************************
 * @desc Get All Doctors
 * @route api/doctors
 * @method get
 * @access public
 *********************************/
module.exports.getAllDoctorsCtrl = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({});
  res.status(200).json({ count: doctors.length, doctors });
});

/**********************************
 * @desc Get Single Doctor
 * @route api/doctors/:id
 * @method get
 * @access public
 *********************************/
module.exports.getDoctorByIdCtrl = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  res.status(200).json(doctor);
});

/**********************************
 * @desc Update Doctor Information
 * @route api/doctors/:id
 * @method put
 * @access private (Admin only)
 *********************************/
module.exports.updateDoctorCtrl = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
  }

  doctor.name = req.body.name || doctor.name;
  doctor.specialization = req.body.specialization || doctor.specialization;
  doctor.experience = req.body.experience || doctor.experience;
  doctor.qualifications = req.body.qualifications || doctor.qualifications;
  doctor.availability = req.body.availability || doctor.availability;
  doctor.fee = req.body.fee || doctor.fee;
  doctor.addresses = req.body.addresses || doctor.addresses;

  const updatedDoctor = await doctor.save();
  res.status(200).json({ message: "Doctor updated successfully", updatedDoctor });
});

/**********************************
 * @desc Delete Doctor
 * @route api/doctors/:id
 * @method delete
 * @access private (Admin only)
 *********************************/
module.exports.deleteDoctorCtrl = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  await doctor.deleteOne();
  res.status(200).json({ message: "Doctor deleted successfully" });
});

/**********************************
 * @desc Search Doctors by Specialty
 * @route api/doctors/search/:specialty
 * @method get
 * @access public
 *********************************/
module.exports.searchDoctorsBySpecialtyCtrl = asyncHandler(async (req, res) => {
    const specialty = req.params.specialty;
  
    if (typeof specialty !== 'string' || specialty.trim() === '') {
      return res.status(400).json({ message: "Invalid specialty parameter" });
    }

    const doctors = await Doctor.find({ 
      specialization: { $regex: specialty, $options: "i" }
    });
  
    if (doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found with this specialty" });
    }
  
    res.status(200).json({ count: doctors.length, doctors });
  });
  