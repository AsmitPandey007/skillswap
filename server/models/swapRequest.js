const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

swapRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
