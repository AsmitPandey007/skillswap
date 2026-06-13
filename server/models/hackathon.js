const mongoose = require("mongoose");

const hackathonApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleAppliedFor: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const hackathonSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    deadline: {
      type: Date,
      required: true,
    },
    teamSize: {
      type: Number,
      required: true,
      min: 2, // Creator + Teammates
    },
    requiredRoles: {
      type: [String],
      required: true,
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    requiredSkillsVectors: [
      {
        skill: String,
        vector: [Number],
      },
    ],
    applications: [hackathonApplicationSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hackathon", hackathonSchema);
