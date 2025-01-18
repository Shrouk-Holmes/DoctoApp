const jwt = require("jsonwebtoken");
const User = require("../models/userModel").User;
require('dotenv').config();

/**********************************
 * @desc Verify JWT Token
 * @method Middleware
 * @access All Routes
 **********************************/
async function verifyToken(req, res, next) {
    const authToken = req.headers.authorization;

    if (authToken) {
        const token = authToken.split(" ")[1];

        try {
            const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decodedPayload._id);

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            if (user.tokenVersion !== decodedPayload.tokenVersion) {
                return res.status(401).json({ message: "Token is invalid or expired" });
            }

            req.user = decodedPayload;
            next();
        } catch (err) {
            
            console.error(err);
            console.error("JWT Error:", err); // Debug log

            return res.status(401).json({ message: "Invalid token" });
        }
    } else {
        return res.status(401).json({ message: "No token provided" });
    }
}

/**********************************
 * @desc Verify Token & Admin Access
 * @method Middleware
 * @access Admin Routes
 **********************************/
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user?.isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
    });
}

/**********************************
 * @desc Verify Token & User Ownership
 * @method Middleware
 * @access User-Specific Routes
 **********************************/
function verifyTokenOnlyUser(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user._id === req.params.id) {
            next();
        } else {
            console.log("User ID:", id);
console.log("Request Body:", req.body);

            return res.status(403).json({ message: "Access denied. User mismatch." });
        }
    });
}

/**********************************
 * @desc Verify Token & Admin/User Access
 * @method Middleware
 * @access Admin/User Routes
 **********************************/
function verifyTokenAndAuth(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user._id === req.params.id || req.user?.isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: "Access denied. Admin or user mismatch." });
        }
    });
}

module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenOnlyUser, verifyTokenAndAuth };
