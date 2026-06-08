const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  skillsOffered: {
    type: [String],
    default: []
  },

  skillsWanted: {
    type: [String],
    default: []
  },

  bio: {
    type: String,
    default: ""
  },

  location: {
    type: String,
    default: ""
  },

  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert", ""],
    default: ""
  },

  availability: {
    type: [String],
    default: []
  },

  languages: {
    type: [String],
    default: []
  },

  rating: {
    type: Number,
    default: 0
  },

  profileImage: {
    type: String,
    default: ""
  },

  skillsOfferedEmbedding: {
    type: [Number],
    default: []
  },

  skillsWantedEmbedding: {
    type: [Number],
    default: []
  },

  skillsOfferedVectors: [{
    skill: String,
    vector: [Number]
  }],

  skillsWantedVectors: [{
    skill: String,
    vector: [Number]
  }],

  embeddingUpdatedAt: {
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);