const mongoose = require('mongoose');
module.exports = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            serverSelectionTimeoutMS: 5000,            }),
        console.log("connected to Mongoose 🫡");
    }
    catch(err){
        console.log("connection failed to MongoDB",err);
    }
}