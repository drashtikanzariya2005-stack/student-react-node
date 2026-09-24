const Food = require("../models/Food");
const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");
const MainCategory = require("../models/MainCategory");

// GET all foods (supports optional ?category=, ?subCategory=, ?dietType=, ?restaurant= and ?search= query filters)
const getFoods = async (req, res) => {
    try {
        const { category, subCategory, dietType, restaurant, search } = req.query;
        const filter = {};

        const subName = category || subCategory;
        if (subName && subName !== "All") {
            const escaped = subName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { category: { $regex: new RegExp(`^${escaped}$`, "i") } },
                { subCategory: { $regex: new RegExp(`^${escaped}$`, "i") } },
            ];
        }

        if (dietType && dietType !== "All") {
            const escapedDiet = dietType.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.dietType = { $regex: new RegExp(`^${escapedDiet}$`, "i") };
        }

        if (restaurant) {
            const byId = restaurant.match(/^[0-9a-fA-F]{24}$/) ? restaurant : null;
            const match = byId || (await Restaurant.findOne({ name: restaurant }))?._id;
            filter.restaurant = match || null;
        }

        if (search) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        const foods = await Food.find(filter)
            .populate("restaurant", "name image rating")
            .sort({ createdAt: -1 });

        res.status(200).json(foods);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET single food by id
const getFoodById = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id).populate("restaurant", "name image rating");

        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        res.status(200).json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ADD food (admin only)
const addFood = async (req, res) => {
    try {
        const { name, price, description, category, subCategory, dietType, restaurant, image } = req.body;

        if (!name || price === undefined || price === null || price === "") {
            return res.status(400).json({
                message: "Name and price are required",
            });
        }

        const mainCategoryName = String(dietType || "Veg").trim();
        const subCategoryName = String(category || subCategory || "").trim();

        // Ensure MainCategory exists
        let mainDoc = await MainCategory.findOne({
            name: { $regex: new RegExp(`^${mainCategoryName}$`, "i") },
        });

        if (!mainDoc) {
            mainDoc = await MainCategory.create({
                name: mainCategoryName,
                icon: "🍽️",
                isActive: true,
            });
        }

        // If sub-category was specified, ensure it is registered in Category collection
        if (subCategoryName) {
            const catDoc = await Category.findOne({
                mainCategory: { $regex: new RegExp(`^${mainDoc.name}$`, "i") },
                name: { $regex: new RegExp(`^${subCategoryName}$`, "i") },
            });

            if (!catDoc) {
                await Category.create({
                    mainCategory: mainDoc.name,
                    mainCategoryId: mainDoc._id,
                    name: subCategoryName,
                    image: image || "",
                    description: description || "",
                    isActive: true,
                });
            }
        }

        const newFood = new Food({
            name: String(name).trim(),
            price: Number(price),
            description: description || "",
            category: subCategoryName,
            subCategory: subCategoryName,
            dietType: mainDoc.name,
            restaurant: restaurant || null,
            image: image || ""
        });

        const savedFood = await newFood.save();
        await savedFood.populate("restaurant", "name image rating");

        res.status(201).json(savedFood);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// UPDATE food (admin only)
const updateFood = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.restaurant === "") {
            updateData.restaurant = null;
        }

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        const mainCategoryName = String(updateData.dietType || "").trim();
        const subCategoryName = String(updateData.category || updateData.subCategory || "").trim();

        if (mainCategoryName) {
            let mainDoc = await MainCategory.findOne({
                name: { $regex: new RegExp(`^${mainCategoryName}$`, "i") },
            });

            if (!mainDoc) {
                mainDoc = await MainCategory.create({
                    name: mainCategoryName,
                    icon: "🍽️",
                    isActive: true,
                });
            }

            updateData.dietType = mainDoc.name;

            if (subCategoryName) {
                updateData.category = subCategoryName;
                updateData.subCategory = subCategoryName;

                const catDoc = await Category.findOne({
                    mainCategory: { $regex: new RegExp(`^${mainDoc.name}$`, "i") },
                    name: { $regex: new RegExp(`^${subCategoryName}$`, "i") },
                });

                if (!catDoc) {
                    await Category.create({
                        mainCategory: mainDoc.name,
                        mainCategoryId: mainDoc._id,
                        name: subCategoryName,
                        image: updateData.image || "",
                        description: updateData.description || "",
                        isActive: true,
                    });
                }
            }
        }

        const updatedFood = await Food.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate("restaurant", "name image rating");

        if (!updatedFood) {
            return res.status(404).json({
                message: "Food not found"
            });
        }

        res.status(200).json(updatedFood);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// DELETE food (admin only)
const deleteFood = async (req, res) => {
    try {
        const deletedFood = await Food.findByIdAndDelete(req.params.id);

        if (!deletedFood) {
            return res.status(404).json({
                message: "Food not found"
            });
        }

        res.status(200).json({
            message: "Food deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getFoods,
    getFoodById,
    addFood,
    updateFood,
    deleteFood
};
