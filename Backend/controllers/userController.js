const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    user.isOnline = true;
    user.lastLogin = new Date();
    await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication is not configured. Set JWT_SECRET in Backend/.env and restart the backend.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGOUT USER — marks the account Inactive so the admin's user list is accurate.
const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.isOnline = false;
      user.lastLogout = new Date();
      await user.save();
    }

    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET LOGGED-IN USER PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LOGGED-IN USER'S PROFILE (name, phone, address)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD (logged-in user)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ADMIN: USER MANAGEMENT ----------

// GET ALL USERS (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER ROLE / BLOCK STATUS (admin only)
const updateUser = async (req, res) => {
  try {
    const { role, isBlocked, name, email, phone, address } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === req.params.id && role && role !== user.role) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    if (role) user.role = role;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isOnline: user.isOnline,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER (admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT / RESET PASSWORD (Public endpoint for user or admin)
const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword, role } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Please provide email and new password" });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const trimmedEmail = email.trim();
    const user = await User.findOne({
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") },
    });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    if (role === "admin" && user.role !== "admin") {
      return res.status(403).json({
        message: "This account does not have administrator privileges",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalRecords, activeRecords, recordsAddedToday] =
      await Promise.all([
        User.countDocuments({ role: "user" }),

        User.countDocuments({
          role: "user",
          isOnline: true,
        }),

        User.countDocuments({
          role: "user",
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        }),
      ]);

    res.status(200).json({
      totalRecords,
      activeRecords,
      recordsAddedToday,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user status",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserStatus,
};
