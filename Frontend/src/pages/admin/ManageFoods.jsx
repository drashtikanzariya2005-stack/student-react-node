import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  name: "",
  price: "",
  description: "",
  category: "", // SUB-CATEGORY name
  dietType: "Veg", // MAIN CATEGORY name
  restaurant: "",
  image: "",
  preparationTime: 15,
};

function ManageFoods() {
  const [foods, setFoods] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterMain, setFilterMain] = useState("All");
  const [filterSub, setFilterSub] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [foodsData, mainsData, subsData, restsData] = await Promise.all([
        adminApiFetch("/foods"),
        adminApiFetch("/categories/main"),
        adminApiFetch("/categories"),
        adminApiFetch("/restaurants"),
      ]);

      setFoods(foodsData || []);
      const mains = mainsData || [];
      setMainCategories(mains);
      setCategories(subsData || []);
      setRestaurants(restsData || []);

      if (mains.length > 0 && !form.dietType) {
        setForm((prev) => ({ ...prev, dietType: mains[0].name }));
      }
    } catch (error) {
      setMessage(error.message || "Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subcategories available for form
  const availableSubcategories = useMemo(() => {
    const selectedMain = (form.dietType || "").toLowerCase();
    const subs = categories.filter(
      (c) => (c.mainCategory || "").toLowerCase() === selectedMain && c.isActive !== false
    );

    const seen = new Set();
    return subs.filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, form.dietType]);

  // Subcategories available for filter
  const filterSubcategories = useMemo(() => {
    if (filterMain === "All") return categories;
    return categories.filter(
      (c) => (c.mainCategory || "").toLowerCase() === filterMain.toLowerCase()
    );
  }, [categories, filterMain]);

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesMain =
        filterMain === "All" ||
        (food.dietType || "").toLowerCase() === filterMain.toLowerCase();

      const subName = food.category || food.subCategory || "";
      const matchesSub =
        filterSub === "All" ||
        subName.toLowerCase() === filterSub.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (food.restaurant?.name && food.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesMain && matchesSub && matchesSearch;
    });
  }, [foods, filterMain, filterSub, searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "dietType") {
      setForm({ ...form, dietType: value, category: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      dietType: mainCategories.length > 0 ? mainCategories[0].name : "Veg",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Dish name is required", "error");
      return;
    }
    if (!form.price) {
      showToast("Price is required", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        subCategory: form.category.trim(),
        preparationTime: Number(form.preparationTime),
      };

      if (editingId) {
        await adminApiFetch(`/foods/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Food item updated successfully", "success");
      } else {
        await adminApiFetch("/foods", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast(`"${form.name.trim()}" added to menu`, "success");
      }

      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message || "Something went wrong");
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (food) => {
    setEditingId(food._id);
    setForm({
      name: food.name,
      price: food.price,
      description: food.description || "",
      category: food.category || food.subCategory || "",
      dietType: food.dietType || (mainCategories[0]?.name || "Veg"),
      restaurant: food.restaurant?._id || food.restaurant || "",
      image: food.image || "",
      preparationTime: food.preparationTime || 15,
    });
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this food item? This cannot be undone.")) return;

    try {
      await adminApiFetch(`/foods/${id}`, { method: "DELETE" });
      showToast("Food item deleted", "success");
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to delete item", "error");
    }
  };

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <Link to="/admin" className="admin-back-breadcrumbs">
            ← Dashboard
          </Link>
          <div className="view-badge">MENU CATALOG</div>
          <h1>🍽️ Manage Dishes &amp; Menu</h1>
          <p className="view-subtitle">
            Create, update or remove items. Items are dynamically categorized by Main Category and Subcategory.
          </p>
        </div>

        <div className="view-stat-pill">
          <span className="pill-number">{foods.length}</span>
          <span className="pill-label">Total Dishes</span>
        </div>
      </div>

      {message && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {message}
        </div>
      )}

      {/* FORM CARD */}
      <div className="admin-surface-card admin-form-card">
        <div className="form-card-header">
          <div className="form-card-header-titles">
            <h2>{editingId ? "✏️ Edit Menu Item" : "➕ Add New Menu Dish"}</h2>
            <p className="form-card-desc">
              {editingId
                ? "Update dish name, pricing, category taxonomy, or image url."
                : "Fill out the dish details below. Selecting a Main Category populates its subcategories."}
            </p>
          </div>
          {editingId && (
            <button type="button" className="admin-btn-secondary btn-sm" onClick={resetForm}>
              ✕ Cancel Edit
            </button>
          )}
        </div>

        <form className="modern-admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid-2">
            {/* Dish Name */}
            <div className="admin-input-group">
              <label htmlFor="dish-name">Dish Name *</label>
              <input
                id="dish-name"
                name="name"
                placeholder="e.g. Paneer Butter Masala"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Price */}
            <div className="admin-input-group">
              <label htmlFor="dish-price">Price (₹) *</label>
              <input
                id="dish-price"
                type="number"
                name="price"
                min="0"
                step="1"
                placeholder="e.g. 249"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>
              <div className="admin-input-group">
              <label htmlFor="dish-preparation-time">
                Preparation Time (minutes)
              </label>

              <input
                id="dish-preparation-time"
                type="number"
                name="preparationTime"
                min="1"
                value={form.preparationTime}
                onChange={handleChange}
                placeholder="e.g. 25"
              />
            </div>
            {/* Main Category */}
            <div className="admin-input-group">
              <label htmlFor="dish-main-cat">Main Category (Diet / Cuisine)</label>
              <select
                id="dish-main-cat"
                name="dietType"
                value={form.dietType}
                onChange={handleChange}
              >
                {mainCategories.map((m) => (
                  <option key={m._id} value={m.name}>
                    {m.icon || "🍽️"} {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div className="admin-input-group">
              <label htmlFor="dish-sub-cat">
                Subcategory ({availableSubcategories.length} available)
              </label>
              <select
                id="dish-sub-cat"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">-- Select Subcategory --</option>
                {availableSubcategories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Restaurant */}
            <div className="admin-input-group">
              <label htmlFor="dish-restaurant">Partner Restaurant</label>
              <select
                id="dish-restaurant"
                name="restaurant"
                value={form.restaurant}
                onChange={handleChange}
              >
                <option value="">-- No specific restaurant (Store Direct) --</option>
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>
                    🏪 {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div className="admin-input-group">
              <label htmlFor="dish-image">Dish Image URL</label>
              <input
                id="dish-image"
                name="image"
                placeholder="https://images.unsplash.com/..."
                value={form.image}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div className="admin-input-group full-span">
            <label htmlFor="dish-desc">Dish Description &amp; Ingredients</label>
            <textarea
              id="dish-desc"
              name="description"
              rows={2}
              placeholder="Freshly prepared with authentic spices and served hot..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Image Preview & Submit Actions */}
          <div className="form-bottom-actions-bar">
            {form.image && (
              <div className="image-live-preview-chip">
                <img src={form.image} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                <span>Image Preview</span>
              </div>
            )}

            <div className="btn-group-end">
              {editingId && (
                <button type="button" className="admin-btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="admin-btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "💾 Update Dish" : "➕ Add to Menu"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="admin-surface-card filter-toolbar-card">
        <div className="filter-item-block">
          <label>Filter by Main Category:</label>
          <select
            value={filterMain}
            onChange={(e) => {
              setFilterMain(e.target.value);
              setFilterSub("All");
            }}
          >
            <option value="All">All Main Categories</option>
            {mainCategories.map((m) => (
              <option key={m._id} value={m.name}>
                {m.icon || "🍽️"} {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item-block">
          <label>Filter by Subcategory:</label>
          <select
            value={filterSub}
            onChange={(e) => setFilterSub(e.target.value)}
          >
            <option value="All">All Subcategories</option>
            {filterSubcategories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-search-block">
          <label>Search Dishes:</label>
          <input
            type="search"
            placeholder="Search by name, ingredients, restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {(filterMain !== "All" || filterSub !== "All" || searchQuery) && (
          <button
            type="button"
            className="admin-btn-secondary btn-sm clear-btn"
            onClick={() => {
              setFilterMain("All");
              setFilterSub("All");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* FOOD ITEMS TABLE / CARDS */}
      <div className="admin-surface-card admin-table-container-card">
        <div className="table-header-info">
          <h2>Menu Dishes List ({filteredFoods.length})</h2>
          <span className="table-showing-text">
            Showing {filteredFoods.length} of {foods.length} items
          </span>
        </div>

        {loading ? (
          <div className="admin-loading-box">
            <div className="loading-spinner" />
            <p>Loading dishes...</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="admin-empty-table-state">
            <span className="empty-state-icon">🍽️</span>
            <h3>No Dishes Found</h3>
            <p>
              {searchQuery || filterMain !== "All" || filterSub !== "All"
                ? "Try adjusting your search criteria or filters."
                : "No dishes added yet. Use the form above to add your first menu item."}
            </p>
          </div>
        ) : (
          <div className="admin-responsive-table">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>Image</th>
                  <th>Dish Name</th>
                  <th>Diet / Main</th>
                  <th>Subcategory</th>
                  <th>Restaurant</th>
                  <th>Price</th>
                  <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((food) => {
                  const dietType = food.dietType || "Veg";
                  const dietClass =
                    dietType.toLowerCase() === "non-veg" || dietType.toLowerCase() === "nonveg"
                      ? "diet-tag-nonveg"
                      : dietType.toLowerCase() === "jain"
                      ? "diet-tag-jain"
                      : "diet-tag-veg";

                  return (
                    <tr key={food._id} className="admin-table-row-hover">
                      <td>
                        <img
                          src={
                            food.image ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"
                          }
                          alt={food.name}
                          className="table-dish-thumb"
                        />
                      </td>
                      <td>
                        <strong className="table-item-primary-text">{food.name}</strong>
                        {food.description && (
                          <p className="table-item-desc-text">{food.description}</p>
                        )}
                      </td>
                      <td>
                        <span className={`admin-diet-pill ${dietClass}`}>{dietType}</span>
                      </td>
                      <td>
                        <span className="admin-subcat-badge">
                          {food.category || food.subCategory || "General"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-vendor-text">
                          {food.restaurant?.name || "Direct Kitchen"}
                        </span>
                      </td>
                      <td>
                        <strong className="table-price-tag">₹{food.price}</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="action-btn-edit"
                            onClick={() => handleEdit(food)}
                            title="Edit dish"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="action-btn-delete"
                            onClick={() => handleDelete(food._id)}
                            title="Delete dish"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageFoods;
