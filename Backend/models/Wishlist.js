const mongoose = require("mongoose");

// One wishlist document per user, holding references to saved food items.
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    foods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
