const express = require('express')
const connectToDB = require("./config/connectToDB.js");
const userRoutes = require("./routes/userRoutes.js");
const doctorRoutes = require("./routes/doctorRoutes");
const bookingRoutes = require("./routes/bookingRoutes.js");
const profileRoutes = require("./routes/profileRoutes")
require("dotenv").config()
connectToDB()
const app = express();
app.use(express.json());
 
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/profile", profileRoutes);

const PORT = process.env.PORT ||3000
app.listen(PORT, () => 
    console.log(
        `server is running ${process.env.NODE_ENV} mode on port ${PORT}`
     )
);