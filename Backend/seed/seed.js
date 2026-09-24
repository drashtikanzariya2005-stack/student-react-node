// Run with: node seed/seed.js or npm run seed
// Populates the database with sample foods, categories, restaurants, offers, admin & user.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Food = require("../models/Food");
const User = require("../models/User");
const MainCategory = require("../models/MainCategory");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const Offer = require("../models/Offer");

const restaurantsData = [
  {
    name: "Pizza Corner",
    cuisine: "Pizza, Fast Food, Beverages",
    rating: 4.6,
    address: "SG Highway, Ahmedabad",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
  },
  {
    name: "Burger Bar",
    cuisine: "Burgers, Starters, Drinks",
    rating: 4.4,
    address: "Navrangpura, Ahmedabad",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  },
  {
    name: "Sharma Sweets & Snacks",
    cuisine: "North Indian, Snacks, Desserts",
    rating: 4.5,
    address: "MG Road, Ahmedabad",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600",
  },
  {
    name: "South Spice Kitchen",
    cuisine: "South Indian, Dosas, Idli",
    rating: 4.7,
    address: "CG Road, Ahmedabad",
    image: "https://images.unsplash.com/photo-1626132647523-66c1e14b9a48?w=600",
  },
  {
    name: "Royal Biryani Hub",
    cuisine: "Biryani, Rice, Curries",
    rating: 4.8,
    address: "Vastrapur, Ahmedabad",
    image: "https://images.unsplash.com/photo-1633945274309-2a781f11e64e?w=600",
  },
];

const foods = [
  // ---------- Pizza ----------
  {
    name: "Margherita Pizza",
    price: 249,
    description: "Classic pizza topped with mozzarella, tomato sauce and fresh basil.",
    category: "Pizza",
    dietType: "Veg",
    restaurantName: "Pizza Corner",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
  },
  {
    name: "Farmhouse Pizza",
    price: 329,
    description: "Loaded with onion, capsicum, tomato, mushroom and sweetcorn.",
    category: "Pizza",
    dietType: "Veg",
    restaurantName: "Pizza Corner",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
  },
  {
    name: "Pepperoni Pizza",
    price: 379,
    description: "Loaded with spicy pepperoni and extra mozzarella cheese.",
    category: "Pizza",
    dietType: "Non-Veg",
    restaurantName: "Pizza Corner",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600",
  },
  {
    name: "Paneer Tikka Pizza",
    price: 349,
    description: "Spiced paneer tikka chunks with onion and capsicum on a cheesy base.",
    category: "Pizza",
    dietType: "Veg",
    restaurantName: "Pizza Corner",
    image: "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600",
  },
  {
    name: "BBQ Chicken Pizza",
    price: 399,
    description: "Smoky BBQ chicken with red onions and mozzarella.",
    category: "Pizza",
    dietType: "Non-Veg",
    restaurantName: "Pizza Corner",
    image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600",
  },

  // ---------- Burger ----------
  {
    name: "Chicken Burger",
    price: 179,
    description: "Grilled chicken patty with lettuce, cheese and special sauce.",
    category: "Burger",
    dietType: "Non-Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  },
  {
    name: "Veg Burger",
    price: 129,
    description: "Crispy veg patty with fresh veggies and mayo.",
    category: "Burger",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600",
  },
  {
    name: "Cheese Burst Burger",
    price: 199,
    description: "Double cheese patty burger oozing with melted cheddar.",
    category: "Burger",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600",
  },
  {
    name: "Double Patty Burger",
    price: 229,
    description: "Two juicy patties stacked with cheese and pickles.",
    category: "Burger",
    dietType: "Non-Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600",
  },
  {
    name: "Spicy Paneer Burger",
    price: 159,
    description: "Crispy spiced paneer patty with mint mayo and fresh salad.",
    category: "Burger",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600",
  },

  // ---------- Main Course ----------
  {
    name: "Paneer Butter Masala",
    price: 219,
    description: "Rich and creamy paneer curry cooked in a tomato-butter gravy.",
    category: "Main Course",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600",
  },
  {
    name: "Butter Chicken",
    price: 269,
    description: "Tender chicken pieces simmered in a creamy tomato gravy.",
    category: "Main Course",
    dietType: "Non-Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=600",
  },
  {
    name: "Dal Makhani",
    price: 189,
    description: "Slow-cooked black lentils in a buttery, creamy gravy.",
    category: "Main Course",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
  },
  {
    name: "Chicken Curry",
    price: 259,
    description: "Traditional home-style chicken curry with aromatic spices.",
    category: "Main Course",
    dietType: "Non-Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
  },
  {
    name: "Palak Paneer",
    price: 209,
    description: "Fresh paneer cubes cooked in a smooth spinach gravy.",
    category: "Main Course",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1618449840665-9ed7d40f8f80?w=600",
  },

  // ---------- Rice & Biryani ----------
  {
    name: "Veg Biryani",
    price: 189,
    description: "Fragrant basmati rice cooked with mixed vegetables and spices.",
    category: "Rice",
    dietType: "Veg",
    restaurantName: "Royal Biryani Hub",
    image: "https://images.unsplash.com/photo-1633945274309-2a781f11e64e?w=600",
  },
  {
    name: "Chicken Biryani",
    price: 239,
    description: "Aromatic basmati rice layered with marinated chicken and spices.",
    category: "Rice",
    dietType: "Non-Veg",
    restaurantName: "Royal Biryani Hub",
    image: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=600",
  },
  {
    name: "Jeera Rice",
    price: 129,
    description: "Fragrant basmati rice tempered with roasted cumin seeds.",
    category: "Rice",
    dietType: "Jain",
    restaurantName: "Royal Biryani Hub",
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600",
  },
  {
    name: "Veg Fried Rice",
    price: 149,
    description: "Wok-tossed rice with fresh vegetables and soy seasoning.",
    category: "Rice",
    dietType: "Veg",
    restaurantName: "Royal Biryani Hub",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
  },
  {
    name: "Egg Fried Rice",
    price: 169,
    description: "Classic fried rice tossed with scrambled egg and spring onion.",
    category: "Rice",
    dietType: "Non-Veg",
    restaurantName: "Royal Biryani Hub",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
  },

  // ---------- Starters ----------
  {
    name: "French Fries",
    price: 99,
    description: "Crispy golden fries served with tangy ketchup.",
    category: "Starters",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600",
  },
  {
    name: "Paneer Tikka",
    price: 199,
    description: "Chargrilled paneer cubes marinated in tandoori spices.",
    category: "Starters",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600",
  },
  {
    name: "Chicken Wings",
    price: 219,
    description: "Crispy fried chicken wings tossed in spicy sauce.",
    category: "Starters",
    dietType: "Non-Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600",
  },
  {
    name: "Veg Spring Rolls",
    price: 149,
    description: "Crispy fried rolls stuffed with seasoned vegetables.",
    category: "Starters",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1548507200-0ebd75c85dbc?w=600",
  },
  {
    name: "Chilli Paneer",
    price: 189,
    description: "Crispy paneer tossed in a spicy Indo-Chinese chilli sauce.",
    category: "Starters",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1626777553635-be1fdc85f2f5?w=600",
  },

  // ---------- Dessert ----------
  {
    name: "Chocolate Brownie",
    price: 119,
    description: "Warm fudgy brownie topped with a scoop of vanilla ice cream.",
    category: "Dessert",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
  },
  {
    name: "Gulab Jamun",
    price: 89,
    description: "Soft milk-solid dumplings soaked in warm cardamom sugar syrup.",
    category: "Dessert",
    dietType: "Jain",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1666190092208-2d5d1a5c8dd8?w=600",
  },
  {
    name: "Ice Cream Sundae",
    price: 129,
    description: "Layers of ice cream, chocolate sauce, roasted nuts and cherry.",
    category: "Dessert",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=600",
  },
  {
    name: "Rasmalai",
    price: 99,
    description: "Soft cottage cheese discs soaked in sweetened saffron-cardamom milk.",
    category: "Dessert",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600",
  },
  {
    name: "Chocolate Lava Cake",
    price: 149,
    description: "Warm chocolate cake with a rich molten chocolate center.",
    category: "Dessert",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600",
  },

  // ---------- Beverages ----------
  {
    name: "Cold Coffee",
    price: 89,
    description: "Chilled creamy coffee blended with ice cream and cocoa.",
    category: "Beverages",
    dietType: "Veg",
    restaurantName: "Burger Bar",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
  },
  {
    name: "Masala Chai",
    price: 49,
    description: "Classic Indian spiced tea brewed with fresh milk and ginger.",
    category: "Beverages",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600",
  },
  {
    name: "Fresh Lime Soda",
    price: 59,
    description: "Refreshing lime juice with soda, sweet and salted.",
    category: "Beverages",
    dietType: "Jain",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600",
  },
  {
    name: "Mango Lassi",
    price: 79,
    description: "Thick creamy yogurt drink blended with Alphonso mango pulp.",
    category: "Beverages",
    dietType: "Veg",
    restaurantName: "Sharma Sweets & Snacks",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
  },
  {
    name: "Fresh Orange Juice",
    price: 69,
    description: "Freshly squeezed orange juice packed with natural Vitamin C.",
    category: "Beverages",
    dietType: "Veg",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600",
  },

  // ---------- South Indian ----------
  {
    name: "Masala Dosa",
    price: 99,
    description: "Crispy golden crepe filled with spiced potato masala, chutney and sambar.",
    category: "South Indian",
    dietType: "Veg",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=600",
  },
  {
    name: "Idli Sambar",
    price: 79,
    description: "Soft steamed rice cakes served with piping hot sambar and coconut chutney.",
    category: "South Indian",
    dietType: "Jain",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1589301773859-bb024d7ac02a?w=600",
  },
  {
    name: "Medu Vada",
    price: 69,
    description: "Crispy fried lentil fritters served with chutney and sambar.",
    category: "South Indian",
    dietType: "Jain",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f72e1?w=600",
  },
  {
    name: "Uttapam",
    price: 109,
    description: "Thick savory rice pancake topped with fresh onions, tomatoes and coriander.",
    category: "South Indian",
    dietType: "Veg",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600",
  },
  {
    name: "Rava Dosa",
    price: 99,
    description: "Thin, crispy semolina crepe served with coconut chutney and sambar.",
    category: "South Indian",
    dietType: "Veg",
    restaurantName: "South Spice Kitchen",
    image: "https://images.unsplash.com/photo-1626132647523-66c1e14b9a48?w=600",
  },
];

const offersData = [
  {
    title: "Welcome Discount",
    code: "WELCOME50",
    description: "Get 50% discount up to ₹100 on your first order!",
    discountType: "percent",
    discountValue: 50,
    minOrder: 199,
    isActive: true,
  },
  {
    title: "Mega Flat Discount",
    code: "FLAT100",
    description: "Flat ₹100 OFF on orders above ₹399!",
    discountType: "flat",
    discountValue: 100,
    minOrder: 399,
    isActive: true,
  },
  {
    title: "Festive Feast",
    code: "FESTIVE20",
    description: "Enjoy 20% discount on all orders above ₹249!",
    discountType: "percent",
    discountValue: 20,
    minOrder: 249,
    isActive: true,
  },
  {
    title: "Quick Bite Savings",
    code: "TASTY10",
    description: "10% off on all snacks and fast food orders!",
    discountType: "percent",
    discountValue: 10,
    minOrder: 149,
    isActive: true,
  },
];

const seed = async (exitOnComplete = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/food_delivery");
      console.log("Connected to MongoDB for seeding...");
    }

    // 1. Seed Restaurants
    const restaurantMap = {};
    for (const rData of restaurantsData) {
      let r = await Restaurant.findOne({ name: rData.name });
      if (!r) {
        r = await Restaurant.create(rData);
      } else {
        Object.assign(r, rData);
        await r.save();
      }
      restaurantMap[r.name] = r._id;
    }
    console.log(`✔ Seeded ${Object.keys(restaurantMap).length} restaurants.`);

    // 2. Seed Foods
    await Food.deleteMany({});
    const foodsToInsert = foods.map((f) => {
      const restId = restaurantMap[f.restaurantName] || null;
      const { restaurantName, ...foodFields } = f;
      return {
        ...foodFields,
        restaurant: restId,
      };
    });
    await Food.insertMany(foodsToInsert);
    console.log(`✔ Inserted ${foodsToInsert.length} food items.`);

    // 3. Seed Main Categories
    const mainCategoriesSeed = [
      {
        name: "Veg",
        icon: "🟢",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
        description: "Fresh, healthy and flavorful 100% vegetarian dishes",
        isActive: true,
        order: 1,
      },
      {
        name: "Non-Veg",
        icon: "🔴",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
        description: "Delicious meat, chicken, and seafood specialties",
        isActive: true,
        order: 2,
      },
      {
        name: "Jain",
        icon: "🟡",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
        description: "Pure Jain food prepared without onion, garlic, and root vegetables",
        isActive: true,
        order: 3,
      },
    ];

    const mainCategoryMap = {};
    for (const mc of mainCategoriesSeed) {
      const doc = await MainCategory.findOneAndUpdate(
        { name: mc.name },
        { $set: mc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      mainCategoryMap[mc.name] = doc._id;
    }
    console.log(`✔ Seeded ${mainCategoriesSeed.length} main categories.`);

    // 4. Seed Sub-Categories matching the foods
    const categoryPairs = new Map();
    for (const food of foods) {
      categoryPairs.set(`${food.dietType}|${food.category}`, {
        mainCategory: food.dietType,
        mainCategoryId: mainCategoryMap[food.dietType] || null,
        name: food.category,
        image: food.image,
        description: food.description,
      });
    }

    for (const pair of categoryPairs.values()) {
      await Category.findOneAndUpdate(
        { mainCategory: pair.mainCategory, name: pair.name },
        { $set: { ...pair, isActive: true } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✔ Synced ${categoryPairs.size} sub-categories.`);

    // 4. Seed Offers
    for (const off of offersData) {
      await Offer.findOneAndUpdate(
        { code: off.code },
        { $set: off },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✔ Seeded ${offersData.length} promotional coupons.`);

    // 5. Seed Admin User
    const adminEmail = "admin@fooddelivery.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      console.log("✔ Created admin: admin@fooddelivery.com (pass: Admin@123)");
    }

    // 6. Seed Demo Customer User
    const userEmail = "user@fooddelivery.com";
    const existingUser = await User.findOne({ email: userEmail });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("User@123", 10);
      await User.create({
        name: "Rahul Sharma",
        email: userEmail,
        password: hashedPassword,
        phone: "9876543210",
        address: "Flat 402, Sunshine Heights, MG Road, Ahmedabad",
        role: "user",
      });
      console.log("✔ Created customer: user@fooddelivery.com (pass: User@123)");
    }

    console.log("🎉 Complete database seeding successful!");
    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    if (exitOnComplete) {
      process.exit(1);
    }
  }
};

module.exports = seed;

if (require.main === module) {
  seed(true);
}
