const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    domain: {
      type: String,
      default: "",
    },
    warnings: [warningSchema],
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
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
    requiredSkills: {
      type: [String],
      default: [],
    },
    teamSize: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["recruiting", "active", "completed", "aborted"],
      default: "recruiting",
    },
    ownerDomain: {
      type: String,
      default: "",
    },
    applications: [applicationSchema],
    tasks: [taskSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);

