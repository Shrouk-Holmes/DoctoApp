const router = require("express").Router();
const { getAllUsers, getUserById,updateUser,deleteUser,removePhoto,profilePhotoUploadCtrl} = require("../controllers/profileController");
const { verifyTokenAndAdmin,verifyTokenOnlyUser, verifyToken,verifyTokenAndAuth} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
const photoUpload = require("../middlewares/photoUpload");


router.route("/")
.get(verifyTokenAndAdmin, getAllUsers);

router.route("/removePhoto/:id")
.delete(verifyTokenOnlyUser,removePhoto);

router.route("/photo/:id")
    .post(verifyToken,photoUpload.single("profilePhoto"),profilePhotoUploadCtrl);


router.route("/:id")
    .get(validateObjectId,verifyToken,getUserById)
    .put(validateObjectId,verifyTokenOnlyUser,updateUser)
    .delete(validateObjectId,verifyTokenAndAuth,deleteUser)
module.exports = router;