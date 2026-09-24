const mongoose = require("mongoose");

// Keeps retrying in the background instead of killing the whole server,
// so a temporarily-down MongoDB doesn't take the API down with it.
const connectDB = () => {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/food_delivery";

    mongoose.connect(uri).catch(() => {
        // Logged via the 'error' event below; nothing else to do here.
    });

    mongoose.connection.on("connected", async () => {
        console.log("✅ MongoDB connected");
        try {
            const Food = require("../models/Food");
            const count = await Food.countDocuments();
            if (count === 0) {
                console.log("Database is empty. Initializing sample data...");
                const seed = require("../seed/seed");
                await seed(false);
            }
        } catch (err) {
            console.error("Auto-seed check notice:", err.message);
        }
    });

    mongoose.connection.on("error", (err) => {
        console.log("❌ MongoDB connection error:", err.message);
        console.log(
            "   Check that MongoDB is running and MONGO_URI in Backend/.env is correct."
        );
    });

    mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected. Retrying...");
    });
};

module.exports = connectDB;
