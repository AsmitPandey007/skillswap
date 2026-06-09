const SwapRequest = require("../models/swapRequest");
const User = require("../models/user");
const Notification = require("../models/notification");

function emitToUser(req, userId, event, payload) {
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

async function notifyUser(req, userId, { type, title, body, data }) {
  const notif = await Notification.create({
    user: userId,
    type,
    title,
    body,
    data,
  });
  emitToUser(req, userId, "notification:new", notif);
  return notif;
}

exports.sendRequest = async (req, res) => {
  try {
    const { toUserId, note } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    if (String(toUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const trimmedNote = String(note || "").trim();
    if (!trimmedNote) {
      return res.status(400).json({ message: "Add a short note to impress them" });
    }

    const recipient = await User.findById(toUserId).select("name");
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingAccepted = await SwapRequest.findOne({
      $or: [
        { from: req.user.id, to: toUserId, status: "accepted" },
        { from: toUserId, to: req.user.id, status: "accepted" },
      ],
    });

    if (existingAccepted) {
      return res.status(400).json({ message: "You are already connected" });
    }

    const request = await SwapRequest.findOneAndUpdate(
      { from: req.user.id, to: toUserId },
      {
        from: req.user.id,
        to: toUserId,
        note: trimmedNote.slice(0, 250),
        status: "pending",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("from", "name profileImage skillsOffered");

    const sender = await User.findById(req.user.id).select("name");

    await notifyUser(req, toUserId, {
      type: "swap_request",
      title: "New swap request",
      body: `${sender.name}: ${trimmedNote.slice(0, 100)}`,
      data: { requestId: request._id, from: req.user.id },
    });

    emitToUser(req, toUserId, "request:new", request);

    res.status(201).json({
      message: "Request sent",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listConnections = async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [{ from: req.user.id }, { to: req.user.id }],
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listIncoming = async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      to: req.user.id,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate("from", "name profileImage skillsOffered skillsWanted bio rating ratingCount")
      .lean();

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStatusWithUser = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const request = await SwapRequest.findOne({
      $or: [
        { from: req.user.id, to: otherUserId },
        { from: otherUserId, to: req.user.id },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!request) {
      return res.json({ status: "none" });
    }

    let role = "none";
    if (String(request.from) === String(req.user.id)) {
      role = "sent";
    } else if (String(request.to) === String(req.user.id)) {
      role = "received";
    }

    res.json({
      status: request.status,
      role,
      requestId: request._id,
      note: request.note,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const request = await SwapRequest.findById(req.params.id).populate(
      "from",
      "name profileImage"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.to) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the recipient can accept" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    request.status = "accepted";
    await request.save();

    const accepter = await User.findById(req.user.id).select("name");

    await notifyUser(req, request.from._id, {
      type: "swap_accepted",
      title: "Request accepted!",
      body: `${accepter.name} accepted your swap request. Start chatting now.`,
      data: { requestId: request._id, to: req.user.id },
    });

    emitToUser(req, request.from._id, "request:accepted", request);

    res.json({
      message: "Request accepted",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const request = await SwapRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.to) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the recipient can decline" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    request.status = "declined";
    await request.save();

    res.json({
      message: "Request declined",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
