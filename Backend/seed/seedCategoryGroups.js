// Run with: node seed/seedCategoryGroups.js
//
// This seed keeps the fixed customer-facing main categories:
//   Veg, Non-Veg, Jain
//
// Existing food records are used to automatically create the sub-categories
// that are already present in the database. Existing category metadata is
// preserved where possible.
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Food = require("../models/Food");

const MAIN_CATEGORIES = ["Veg", "Non-Veg", "Jain"];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for fixed category sync...");

    const foods = await Food.find(
      {
        dietType: { $in: MAIN_CATEGORIES },
      },
      "dietType category subCategory image description"
    ).lean();

    const seen = new Set();

    for (const food of foods) {
      const mainCategory = food.dietType;
      const subName = String(food.subCategory || food.category || "").trim();

      if (!MAIN_CATEGORIES.includes(mainCategory) || !subName) {
        continue;
      }

      const key = `${mainCategory}::${subName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const result = await Category.findOneAndUpdate(
        {
          mainCategory,
          name: subName,
        },
        {
          $setOnInsert: {
            mainCategory,
            name: subName,
            image: food.image || "",
            description: food.description || "",
            isActive: true,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`✔ ${mainCategory} -> ${result.name}`);
    }

    console.log("\n✅ Fixed main/sub-category sync complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Category sync failed:", error.message);
    process.exit(1);
  }
};

run();
