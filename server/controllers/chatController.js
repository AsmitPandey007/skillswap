const Message = require("../models/message");

const conversationIdFor = (a, b) => {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}:${y}`;
};

exports.getMessagesWithUser = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const conversationId = conversationIdFor(req.user.id, otherUserId);

    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ conversationId, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports._conversationIdFor = conversationIdFor;

