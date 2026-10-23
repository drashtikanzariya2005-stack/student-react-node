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
     
        category: {
            type: String,
            default: "",
            trim: true
        },
        
        subCategory: {
            type: String,
            default: "",
            trim: true
        },
        
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
        },
        preparationTime: {
    type: Number,
    default: 15,
    min: 1
}
    },
    {
        timestamps: true
    }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;