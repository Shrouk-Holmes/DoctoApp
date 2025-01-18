const express = require("express");
const router = express.Router();
const {
  addDoctorCtrl,
  getAllDoctorsCtrl,
  getDoctorByIdCtrl,
  updateDoctorCtrl,
  deleteDoctorCtrl,
  searchDoctorsBySpecialtyCtrl,
} = require("../controllers/doctorController");
const { verifyTokenAndAdmin} = require("../middlewares/verifyToken"); 
const validateObjectId = require('../middlewares/validateObjectId');

router.route("/")
    .post(verifyTokenAndAdmin, addDoctorCtrl) 
    .get(getAllDoctorsCtrl); 

router.route("/:id")
    .get(validateObjectId, getDoctorByIdCtrl)
    .put(validateObjectId, verifyTokenAndAdmin, updateDoctorCtrl) 
    .delete(validateObjectId, verifyTokenAndAdmin, deleteDoctorCtrl); 

router.route("/search/:specialty").get(searchDoctorsBySpecialtyCtrl);

module.exports = router;
