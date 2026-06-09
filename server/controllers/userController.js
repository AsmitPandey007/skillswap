const User = require("../models/user");
const { buildUserEmbeddings, isEmbeddingAvailable } = require("../services/embeddingService");

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {

  try {

    const {
      bio,
      skillsOffered,
      skillsWanted,
      location,
      skillLevel,
      availability,
      languages
    } = req.body;

    const offered = normalizeList(skillsOffered);
    const wanted = normalizeList(skillsWanted);

    if (offered.length === 0 && wanted.length === 0) {
      return res.status(400).json({
        message: "Add at least one skill in Skills Offered or Skills Wanted (comma-separated)",
      });
    }

    const update = {
      bio,
      skillsOffered: offered,
      skillsWanted: wanted,
      location: String(location || "").trim(),
      skillLevel: skillLevel || "",
      availability: Array.isArray(availability) ? availability : [],
      languages: Array.isArray(languages) ? languages : []
    };

    if (isEmbeddingAvailable()) {
      const embeddings = await buildUserEmbeddings({
        bio,
        skillsOffered,
        skillsWanted
      });
      if (embeddings) {
        Object.assign(update, embeddings);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated",
      user,
      embeddingsUpdated: Boolean(update.embeddingUpdatedAt)
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


