const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        // Sub-category name (e.g. "Pizza", "Burgers", "Cold Drinks")
        category: {
            type: String,
            default: "",
            trim: true
        },
        // Legacy support / alias for category
        subCategory: {
            type: String,
            default: "",
            trim: true
        },
        // Main Category name (e.g. "Veg", "Non-Veg", "Jain", "Beverages", "Desserts", "Fast Food", etc.)
        dietType: {
            type: String,
            default: "Veg",
            trim: true
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            default: null
        },
        image: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;