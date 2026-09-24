const MainCategory = require("../models/MainCategory");
const Category = require("../models/Category");
const Food = require("../models/Food");

const DEFAULT_MAIN_CATEGORIES = [
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

let initialized = false;

/**
 * Initialize default main categories and sync any existing food/category records.
 */
const initAndSyncCategories = async () => {
  if (initialized) return;

  try {
    // 1. Ensure default main categories exist
    for (const def of DEFAULT_MAIN_CATEGORIES) {
      const exists = await MainCategory.findOne({
        name: { $regex: new RegExp(`^${def.name}$`, "i") },
      });
      if (!exists) {
        await MainCategory.create(def);
      }
    }

    // 2. Discover any custom dietType or mainCategory from Food/Category collections
    const distinctDietTypes = await Food.distinct("dietType");
    const distinctCatMains = await Category.distinct("mainCategory");
    const allKnownMains = Array.from(
      new Set([...distinctDietTypes, ...distinctCatMains].filter(Boolean))
    );

    for (const mainName of allKnownMains) {
      const clean = String(mainName).trim();
      if (!clean) continue;
      const exists = await MainCategory.findOne({
        name: { $regex: new RegExp(`^${clean}$`, "i") },
      });
      if (!exists) {
        await MainCategory.create({
          name: clean,
          icon: "🍽️",
          description: `${clean} food & dishes`,
          isActive: true,
        });
      }
    }

    // 3. Sync categories from Food items if any food has category that isn't in Category collection
    const foods = await Food.find(
      {
        $or: [
          { category: { $exists: true, $nin: [null, ""] } },
          { subCategory: { $exists: true, $nin: [null, ""] } },
        ],
      },
      "dietType category subCategory image description"
    ).lean();

    for (const food of foods) {
      const mainName = String(food.dietType || "Veg").trim();
      const subName = String(food.category || food.subCategory || "").trim();
      if (!mainName || !subName) continue;

      const mainDoc = await MainCategory.findOne({
        name: { $regex: new RegExp(`^${mainName}$`, "i") },
      });

      const existingCat = await Category.findOne({
        mainCategory: { $regex: new RegExp(`^${mainName}$`, "i") },
        name: { $regex: new RegExp(`^${subName}$`, "i") },
      });

      if (!existingCat) {
        await Category.create({
          mainCategory: mainDoc ? mainDoc.name : mainName,
          mainCategoryId: mainDoc ? mainDoc._id : null,
          name: subName,
          image: food.image || "",
          description: food.description || "",
          isActive: true,
        });
      }
    }

    initialized = true;
  } catch (error) {
    console.error("Init & Sync Categories error:", error.message);
  }
};

// ==========================================
// MAIN CATEGORIES CONTROLLERS
// ==========================================

// GET all main categories with subcategories count
exports.getMainCategories = async (req, res) => {
  try {
    await initAndSyncCategories();

    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === "true") {
      filter.isActive = true;
    }

    const mainCategories = await MainCategory.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Attach subcategory counts
    const subCounts = await Category.aggregate([
      { $group: { _id: "$mainCategory", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    for (const item of subCounts) {
      if (item._id) countMap[item._id.toLowerCase()] = item.count;
    }

    const result = mainCategories.map((main) => ({
      ...main,
      subCategoryCount: countMap[main.name.toLowerCase()] || 0,
    }));

    res.json(result);
  } catch (e) {
    console.error("getMainCategories error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ADD a new main category (Admin only)
exports.createMainCategory = async (req, res) => {
  try {
    const { name, icon, image, description, isActive, order } = req.body;
    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({ message: "Main category name is required" });
    }

    const existing = await MainCategory.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ message: `Main category "${cleanName}" already exists` });
    }

    const mainCategory = await MainCategory.create({
      name: cleanName,
      icon: icon || "🍽️",
      image: image || "",
      description: description || "",
      isActive: isActive !== false,
      order: Number(order) || 0,
    });

    res.status(201).json(mainCategory);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// UPDATE a main category (Admin only)
exports.updateMainCategory = async (req, res) => {
  try {
    const { name, icon, image, description, isActive, order } = req.body;
    const current = await MainCategory.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const oldName = current.name;
    const updateData = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ message: "Main category name cannot be empty" });
      }

      const duplicate = await MainCategory.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${cleanName}$`, "i") },
      });

      if (duplicate) {
        return res.status(400).json({ message: `Main category "${cleanName}" already exists` });
      }

      updateData.name = cleanName;
    }

    if (icon !== undefined) updateData.icon = icon;
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (order !== undefined) updateData.order = Number(order) || 0;

    const updated = await MainCategory.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // If main category name was updated, cascade name change to subcategories and foods!
    if (updateData.name && updateData.name !== oldName) {
      await Category.updateMany(
        { mainCategory: oldName },
        { $set: { mainCategory: updateData.name, mainCategoryId: updated._id } }
      );
      await Food.updateMany(
        { dietType: oldName },
        { $set: { dietType: updateData.name } }
      );
    }

    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE a main category (Admin only)
exports.deleteMainCategory = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);
    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }

    // Check if subcategories or foods exist under this main category
    const subCount = await Category.countDocuments({ mainCategory: mainCategory.name });
    const foodCount = await Food.countDocuments({ dietType: mainCategory.name });

    if (req.query.force === "true") {
      // Delete subcategories and unassign foods
      await Category.deleteMany({ mainCategory: mainCategory.name });
      await Food.updateMany({ dietType: mainCategory.name }, { $set: { dietType: "Veg" } });
    } else if (subCount > 0 || foodCount > 0) {
      return res.status(400).json({
        message: `Cannot delete "${mainCategory.name}" because it contains ${subCount} sub-category(ies) and ${foodCount} food item(s). Delete or reassign them first, or pass force=true.`,
        subCount,
        foodCount,
      });
    }

    await MainCategory.findByIdAndDelete(req.params.id);
    res.json({ message: `Main category "${mainCategory.name}" deleted successfully` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ==========================================
// SUBCATEGORIES (Category) CONTROLLERS
// ==========================================

// GET all subcategories
exports.getCategories = async (req, res) => {
  try {
    await initAndSyncCategories();

    const { mainCategory, activeOnly, search } = req.query;
    const filter = {};

    if (mainCategory && mainCategory !== "All") {
      filter.mainCategory = { $regex: new RegExp(`^${mainCategory.trim()}$`, "i") };
    }

    if (activeOnly === "true") {
      filter.isActive = true;
    }

    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const categories = await Category.find(filter)
      .populate("mainCategoryId", "name icon image isActive")
      .sort({ mainCategory: 1, order: 1, name: 1 });

    res.json(categories);
  } catch (e) {
    console.error("getCategories error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ADD a subcategory (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { mainCategory, name, image, description, isActive, order } = req.body;
    const cleanMain = String(mainCategory || "").trim();
    const cleanName = String(name || "").trim();

    if (!cleanMain) {
      return res.status(400).json({ message: "Main category is required" });
    }

    if (!cleanName) {
      return res.status(400).json({ message: "Sub-category name is required" });
    }

    // Look up or auto-ensure MainCategory
    let mainDoc = await MainCategory.findOne({
      name: { $regex: new RegExp(`^${cleanMain}$`, "i") },
    });

    if (!mainDoc) {
      mainDoc = await MainCategory.create({
        name: cleanMain,
        icon: "🍽️",
        isActive: true,
      });
    }

    const existing = await Category.findOne({
      mainCategory: { $regex: new RegExp(`^${mainDoc.name}$`, "i") },
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        message: `Sub-category "${cleanName}" already exists under main category "${mainDoc.name}".`,
      });
    }

    const category = await Category.create({
      mainCategory: mainDoc.name,
      mainCategoryId: mainDoc._id,
      name: cleanName,
      image: image || "",
      description: description || "",
      isActive: isActive !== false,
      order: Number(order) || 0,
    });

    res.status(201).json(category);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// UPDATE a subcategory (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const update = { ...req.body };
    const current = await Category.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ message: "Category not found" });
    }

    let targetMainName = current.mainCategory;
    let targetMainId = current.mainCategoryId;

    if (update.mainCategory) {
      const cleanMain = String(update.mainCategory).trim();
      let mainDoc = await MainCategory.findOne({
        name: { $regex: new RegExp(`^${cleanMain}$`, "i") },
      });
      if (!mainDoc) {
        mainDoc = await MainCategory.create({
          name: cleanMain,
          icon: "🍽️",
          isActive: true,
        });
      }
      targetMainName = mainDoc.name;
      targetMainId = mainDoc._id;
      update.mainCategory = targetMainName;
      update.mainCategoryId = targetMainId;
    }

    if (update.name !== undefined) {
      update.name = String(update.name).trim();
      if (!update.name) {
        return res.status(400).json({ message: "Sub-category name cannot be empty" });
      }
    }

    const finalName = update.name || current.name;

    const duplicate = await Category.findOne({
      _id: { $ne: req.params.id },
      mainCategory: { $regex: new RegExp(`^${targetMainName}$`, "i") },
      name: { $regex: new RegExp(`^${finalName}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        message: `Sub-category "${finalName}" already exists under "${targetMainName}".`,
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    res.json(updatedCategory);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE a subcategory (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: `Sub-category "${category.name}" deleted successfully` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
