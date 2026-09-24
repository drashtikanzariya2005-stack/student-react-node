const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // The name of the Main Category this subcategory belongs to (e.g. "Veg", "Fast Food", "Beverages")
    mainCategory: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // Reference to MainCategory document (optional, for relational consistency)
    mainCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainCategory",
      default: null,
    },

    // This is the SUB-CATEGORY name shown inside the selected main category.
    // Example: mainCategory = "Veg", name = "Pizza".
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// The same sub-category name may be used in different main categories,
// but it is unique inside a single main category.
categorySchema.index({ mainCategory: 1, name: 1 });

module.exports = mongoose.model("Category", categorySchema);
