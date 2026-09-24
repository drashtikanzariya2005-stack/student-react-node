require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const app = express();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing. Create Backend/.env and set JWT_SECRET before starting the server.");
  process.exit(1);
}

// Only the configured frontend origin may call this API. CLIENT_URL lives in
// Backend/.env; if it isn't set, fall back to allowing everything so local
// development still works out of the box.
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
  })
);
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Fail fast (instead of hanging ~10s) if MongoDB isn't connected yet,
// so the frontend gets a clear, immediate error instead of a silent timeout.
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "Database not connected. Make sure MongoDB is running and MONGO_URI in Backend/.env is correct, then restart the server.",
    });
  }
  next();
});

const foodRoutes = require("./routes/foodRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const offerRoutes = require("./routes/offerRoutes");

app.use("/api/foods", foodRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/offers", offerRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You can access protected route",
    user: req.user,
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (catches thrown/async errors not already handled)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong on the server",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
