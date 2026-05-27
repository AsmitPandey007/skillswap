const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

module.exports = (req, res, next) => {

  const token = req.headers.authorization;

  if (!token) {

    return res.status(401).json({
      message: "No token"
    });

  }

  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid token"
    });

  }

};