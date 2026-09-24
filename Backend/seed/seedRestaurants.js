// Run with: node seed/seedRestaurants.js
//
// The "restaurant" field on a Food item is optional and starts empty — so
// until at least one restaurant exists AND some food items are linked to
// it, the 🏪 badge on the customer Menu page has nothing to show. This
// script creates a few sample restaurants and links every food item that
// doesn't already have one, so the feature is visible immediately.
//
// SAFE TO RE-RUN: restaurants are matched by name (not duplicated), and
// only food items with restaurant = null get assigned — anything you've
// already linked via the admin panel is left untouched.
require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");

const RESTAURANTS = [
  {
    name: "Sharma Sweets & Snacks",
    cuisine: "North Indian, Snacks, Desserts",
    rating: 4.3,
    address: "MG Road, Ahmedabad",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600",
  },
  {
    name: "Pizza Corner",
    cuisine: "Pizza, Fast Food",
    rating: 4.5,
    address: "SG Highway, Ahmedabad",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
  },
  {
    name: "South Spice Kitchen",
    cuisine: "South Indian",
    rating: 4.6,
    address: "CG Road, Ahmedabad",
    image: "https://images.unsplash.com/photo-1626132647523-66c1e14b9a48?w=600",
  },
];

const upsertRestaurant = async (data) => {
  let r = await Restaurant.findOne({ name: data.name });
  if (!r) r = await Restaurant.create(data);
  return r;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for restaurant seeding...");

    const [sharma, pizzaCorner, southSpice] = await Promise.all(
      RESTAURANTS.map(upsertRestaurant)
    );
    console.log(`✔ Restaurants ready: ${RESTAURANTS.map((r) => r.name).join(", ")}`);

    const unlinkedFoods = await Food.find({
      $or: [{ restaurant: null }, { restaurant: { $exists: false } }],
    });

    let updated = 0;
    for (let i = 0; i < unlinkedFoods.length; i++) {
      const food = unlinkedFoods[i];
      let target;

      if (food.category === "Pizza" || food.subCategory === "Pizza") {
        target = pizzaCorner;
      } else if (food.category === "South Indian" || food.subCategory === "South Indian") {
        target = southSpice;
      } else {
        // Everything else rotates across all 3 so the badge shows variety.
        target = [sharma, pizzaCorner, southSpice][i % 3];
      }

      food.restaurant = target._id;
      await food.save();
      updated += 1;
    }

    console.log(`✅ Linked ${updated} food item(s) to a restaurant.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Restaurant seeding failed:", error.message);
    process.exit(1);
  }
};

run();
