const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message:
      "Database not connected. Add a valid MONGO_URI to server/.env and restart the server."
  });
};
