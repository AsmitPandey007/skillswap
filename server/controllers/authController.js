const User = require("../models/user");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");


// REGISTER
exports.register = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(400).json({
        message: "User already exists"
      });

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// LOGIN
exports.login = async (req, res) => {

  try {

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {

      return res.status(400).json({
        message: "User not found"
      });

    }

    // Compare passwords
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid credentials"
      });

    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};