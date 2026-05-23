const User = require("../models/user");


// UPDATE PROFILE
exports.updateProfile = async (req, res) => {

  try {

    const {
      bio,
      skillsOffered,
      skillsWanted
    } = req.body;

    const user = await User.findByIdAndUpdate(

      req.user.id,

      {
        bio,
        skillsOffered,
        skillsWanted
      },

      { new: true }

    );

    res.json({
      message: "Profile updated",
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// UPLOAD PROFILE IMAGE
const cloudinary = require("../config/cloudinary");

exports.uploadProfileImage = async(req,res)=>{

try{

if(!req.file){

return res.status(400).json({

message:"No image selected"

});

}

const result = await cloudinary.uploader.upload(

`data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,

{

folder:"skillswap"

}

);

const user = await User.findById(

req.user.id

);

user.profileImage = result.secure_url;

await user.save();

res.json({

message:"Image uploaded",

profileImage:user.profileImage

});

}

catch(error){

console.log(error);

res.status(500).json({

message:error.message

});

}

};

// GET PROFILE
exports.getProfile = async (req, res) => {

  try {

    const user = await User.findById(
      req.user.id
    );

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


