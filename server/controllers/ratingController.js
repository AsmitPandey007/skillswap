const mongoose = require("mongoose");
const Rating = require("../models/rating");
const User = require("../models/user");
const Message = require("../models/message");
const { _conversationIdFor } = require("./chatController");

const MIN_SESSION_MESSAGES = 3;

async function recalculateUserRating(userId) {
  const stats = await Rating.aggregate([
    { $match: { to: new mongoose.Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$stars" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await User.findByIdAndUpdate(userId, {
    rating: count > 0 ? Math.round(avg * 10) / 10 : 0,
    ratingCount: count,
  });

  return { rating: count > 0 ? Math.round(avg * 10) / 10 : 0, ratingCount: count };
}

exports.getRatingStatus = async (req, res) => {
  try {
    const toUserId = req.params.userId;

    if (String(toUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot rate yourself" });
    }

    const partner = await User.findById(toUserId).select("name profileImage rating ratingCount");
    if (!partner) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversationId = _conversationIdFor(req.user.id, toUserId);
    const messageCount = await Message.countDocuments({ conversationId });

    const existing = await Rating.findOne({
      from: req.user.id,
      to: toUserId,
    }).lean();

    res.json({
      partner: {
        _id: partner._id,
        name: partner.name,
        profileImage: partner.profileImage,
        rating: partner.rating,
        ratingCount: partner.ratingCount || 0,
      },
      messageCount,
      minMessagesRequired: MIN_SESSION_MESSAGES,
      canRate: messageCount >= MIN_SESSION_MESSAGES,
      alreadyRated: Boolean(existing),
      yourRating: existing
        ? { stars: existing.stars, comment: existing.comment || "" }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitRating = async (req, res) => {
  try {
    const { toUserId, stars, comment } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "User to rate is required" });
    }

    if (String(toUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot rate yourself" });
    }

    const starsNum = Number(stars);
    if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({ message: "Stars must be between 1 and 5" });
    }

    const partner = await User.findById(toUserId).select("name");
    if (!partner) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversationId = _conversationIdFor(req.user.id, toUserId);
    const messageCount = await Message.countDocuments({ conversationId });

    if (messageCount < MIN_SESSION_MESSAGES) {
      return res.status(400).json({
        message: `Chat at least ${MIN_SESSION_MESSAGES} messages before rating`,
      });
    }

    const rating = await Rating.findOneAndUpdate(
      { from: req.user.id, to: toUserId },
      {
        from: req.user.id,
        to: toUserId,
        stars: starsNum,
        comment: String(comment || "").trim().slice(0, 300),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const updated = await recalculateUserRating(toUserId);

    res.json({
      message: "Rating submitted",
      rating,
      partnerRating: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
