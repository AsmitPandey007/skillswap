const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
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
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 300,
      trim: true,
    },
  },
  { timestamps: true }
);

ratingSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
