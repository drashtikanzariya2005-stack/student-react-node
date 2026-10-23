import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";

function Menu() {
  const [foods, setFoods] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeMainCategory = searchParams.get("diet") || "All";
  const activeSubCategory = searchParams.get("category") || "All";
  const restaurantFilter = searchParams.get("restaurant") || "";

  // Load Main Categories & Subcategories from Backend
  useEffect(() => {
    Promise.all([
      apiFetch("/categories/main?activeOnly=true"),
      apiFetch("/categories?activeOnly=true"),
    ])
      .then(([mainsData, subsData]) => {
        setMainCategories(mainsData || []);
        setCategories(subsData || []);
      })
      .catch(() => {
        setMainCategories([]);
        setCategories([]);
      });
  }, []);

  // Sub-categories belonging to the selected main category
  const subCategoriesForActiveMain = useMemo(() => {
    if (activeMainCategory === "All") {
      // If "All" main categories is selected, extract distinct subcategory names
      const distinctNames = Array.from(
        new Set(categories.filter((c) => c.isActive !== false).map((c) => c.name))
      );
      return distinctNames.length > 0 ? ["All", ...distinctNames] : [];
    }

    const filtered = categories.filter(
      (c) =>
        c.mainCategory?.toLowerCase() === activeMainCategory.toLowerCase() &&
        c.isActive !== false
    );

    const names = Array.from(new Set(filtered.map((c) => c.name)));
    return ["All", ...names];
  }, [categories, activeMainCategory]);

  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    apiFetch("/wishlist")
      .then((data) => setWishlistIds((data.foods || []).map((f) => f._id)))
      .catch(() => setWishlistIds([]));
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFoods = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (activeMainCategory !== "All") {
          params.set("dietType", activeMainCategory);
        }

        if (activeSubCategory !== "All") {
          params.set("category", activeSubCategory);
        }

        if (restaurantFilter) {
          params.set("restaurant", restaurantFilter);
        }

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        const query = params.toString() ? `?${params.toString()}` : "";
        const data = await apiFetch(`/foods${query}`, {
          signal: controller.signal,
        });

        setFoods(data || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load menu");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
    return () => controller.abort();
  }, [activeMainCategory, activeSubCategory, restaurantFilter, searchTerm]);

  const setMainCategory = (mainName) => {
    const next = new URLSearchParams(searchParams);

    if (mainName === "All") {
      next.delete("diet");
    } else {
      next.set("diet", mainName);
    }

    // Reset sub-category when main category changes
    next.delete("category");
    setSearchParams(next);
  };

  const setSubCategory = (subName) => {
    const next = new URLSearchParams(searchParams);

    if (subName === "All") {
      next.delete("category");
    } else {
      next.set("category", subName);
    }

    setSearchParams(next);
  };

  const clearRestaurantFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("restaurant");
    setSearchParams(next);
  };

  const quantityInCart = (id) =>
    cart.find((item) => item._id === id)?.quantity || 0;

  const handleAdd = (food) => {
    addToCart(food);
    showToast(`${food.name} added to cart`, "success");
  };

  const isWishlisted = (id) => wishlistIds.includes(id);

  const handleWishlistToggle = async (food) => {
    if (!user) {
      showToast("Please login to use your wishlist", "error");
      navigate("/login");
      return;
    }

    const alreadyIn = isWishlisted(food._id);
    setWishlistIds((prev) =>
      alreadyIn ? prev.filter((id) => id !== food._id) : [...prev, food._id]
    );

    try {
      await apiFetch(`/wishlist/${food._id}`, { method: "POST" });
      showToast(
        alreadyIn
          ? `${food.name} removed from wishlist`
          : `${food.name} added to wishlist`,
        "success"
      );
    } catch (err) {
      setWishlistIds((prev) =>
        alreadyIn ? [...prev, food._id] : prev.filter((id) => id !== food._id)
      );
      showToast(err.message || "Could not update wishlist", "error");
    }
  };

  const getMainCategoryIcon = (mainName) => {
    const found = mainCategories.find(
      (m) => m.name.toLowerCase() === (mainName || "").toLowerCase()
    );
    return found?.icon || "🍽️";
  };

  return (
    <div className="menu-page">
      <div className="menu-header-section">
        <h1>🍕 Explore Our Menu</h1>
        <p className="menu-subtitle">
          Choose a Main Category to browse dishes by cuisine, dietary choice, or taste!
        </p>
      </div>

      <div className="menu-controls">
        <input
          type="text"
          placeholder="Search dishes, ingredients, restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {restaurantFilter && (
          <div className="active-restaurant-filter">
            🏪 Showing dishes from <strong>{restaurantFilter}</strong>
            <button
              type="button"
              className="btn-outline btn-small"
              onClick={clearRestaurantFilter}
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* ROW 1: DYNAMIC MAIN CATEGORIES */}
        <div className="diet-filter-wrapper">
          <span className="filter-row-label">Main Category:</span>
          <div className="diet-filter">
            <button
              className={`pill pill-diet ${activeMainCategory === "All" ? "pill-active" : ""}`}
              onClick={() => setMainCategory("All")}
            >
              🌟 All Cuisines
            </button>
            {mainCategories.map((main) => (
              <button
                key={main._id}
                className={`pill pill-diet ${
                  activeMainCategory.toLowerCase() === main.name.toLowerCase() ? "pill-active" : ""
                }`}
                onClick={() => setMainCategory(main.name)}
              >
                {main.icon || "🍽️"} {main.name}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: DYNAMIC SUBCATEGORIES FOR ACTIVE MAIN CATEGORY */}
        {subCategoriesForActiveMain.length > 0 && (
          <div className="subcategory-filter-wrapper">
            <span className="filter-row-label">Subcategories:</span>
            <div className="category-pills subcategory-pills">
              {subCategoriesForActiveMain.map((sub) => (
                <button
                  key={sub}
                  className={`pill pill-sub ${
                    activeSubCategory.toLowerCase() === sub.toLowerCase() ? "pill-active" : ""
                  }`}
                  onClick={() => setSubCategory(sub)}
                >
                  {sub === "All" ? "🏷️ All Subcategories" : sub}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="food-container">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="food-card skeleton-card" key={i}>
              <div className="skeleton skeleton-img" />
              <div className="food-card-body">
                <div className="skeleton skeleton-line" style={{ width: "70%" }} />
                <div className="skeleton skeleton-line" style={{ width: "100%" }} />
                <div className="skeleton skeleton-line" style={{ width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && foods.length === 0 && (
        <div className="empty-placeholder-card">
          <span className="empty-icon">🍽️</span>
          <h3>No dishes found in this category</h3>
          <p>Try selecting another main category or clearing your search keywords.</p>
        </div>
      )}

      {!loading && foods.length > 0 && (
        <div className="food-container">
          {foods.map((food) => {
            const mainIcon = getMainCategoryIcon(food.dietType);

            return (
              <div className="food-card" key={food._id}>
                <div className="food-image-wrap">
                  <img
                    src={food.image || PLACEHOLDER_IMAGE}
                    alt={food.name}
                    className="food-image"
                  />
                  <span className="diet-dot-badge" title={food.dietType || "Veg"}>
                    {mainIcon}
                  </span>
                  <button
                    type="button"
                    className={`wishlist-button ${isWishlisted(food._id) ? "wishlisted" : ""}`}
                    onClick={() => handleWishlistToggle(food)}
                    aria-label="Toggle wishlist"
                  >
                    {isWishlisted(food._id) ? "♥" : "♡"}
                  </button>
                </div>

                <div className="food-card-body">
                  <div className="food-card-header-row">
                    <h3>{food.name}</h3>
                  </div>

                  <p className="food-card-desc">{food.description || ""}</p>

                  <div className="food-tags-row">
                    <span className="food-main-tag">
                      {mainIcon} {food.dietType || "Veg"}
                    </span>
                    {food.category || food.subCategory ? (
                      <span className="food-sub-tag">
                        🏷️ {food.category || food.subCategory}
                      </span>
                    ) : null}
                    {food.restaurant?.name ? (
                      <span className="food-rest-tag">
                        🏪 {food.restaurant.name}
                      </span>
                    ) : null}
                    <span className="food-time-tag">
  ⏱️ {food.preparationTime || 15} min
</span>
                  </div>

                  <div className="food-card-footer">
                    <strong className="food-card-price">₹{food.price}</strong>
                    <button
                      type="button"
                      className="btn-primary btn-small add-cart-btn"
                      onClick={() => handleAdd(food)}
                    >
                      {quantityInCart(food._id)
                        ? `Added (${quantityInCart(food._id)})`
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Menu;
