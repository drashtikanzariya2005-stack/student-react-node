import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  name: "",
  address: "",
  image: "",
  cuisine: "",
  rating: 4.5,
  isActive: true,
};

function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch("/restaurants");
      setRestaurants(data || []);
    } catch (error) {
      setMessage(error.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Restaurant name is required", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = { ...form, rating: Number(form.rating) || 0 };

      if (editingId) {
        await adminApiFetch(`/restaurants/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Restaurant updated successfully", "success");
      } else {
        await adminApiFetch("/restaurants", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast(`"${form.name}" added successfully`, "success");
      }

      resetForm();
      await loadRestaurants();
    } catch (error) {
      setMessage(error.message || "Something went wrong");
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setForm({
      name: r.name,
      address: r.address || "",
      image: r.image || "",
      cuisine: r.cuisine || "",
      rating: r.rating ?? 4.5,
      isActive: r.isActive !== false,
    });
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete restaurant "${name}"? Foods linked to it will show as store direct.`)) {
      return;
    }

    try {
      await adminApiFetch(`/restaurants/${id}`, { method: "DELETE" });
      showToast("Restaurant deleted", "success");
      await loadRestaurants();
    } catch (error) {
      showToast(error.message || "Failed to delete", "error");
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
          <div className="view-badge">PARTNERS &amp; KITCHENS</div>
          <h1>🏪 Partner Restaurants</h1>
          <p className="view-subtitle">
            Manage restaurant branches, kitchen locations, partner cuisines, and ratings.
          </p>
        </div>

        <div className="view-stat-pill">
          <span className="pill-number">{restaurants.length}</span>
          <span className="pill-label">Restaurants</span>
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
          <div>
            <h2>{editingId ? "✏️ Edit Restaurant" : "➕ Add Partner Restaurant"}</h2>
            <p className="form-card-desc">
              {editingId
                ? "Update restaurant information, rating, cuisine type or address."
                : "Register a new partner kitchen/restaurant to link with menu dishes."}
            </p>
          </div>
          {editingId && (
            <button type="button" className="admin-btn-secondary btn-sm" onClick={resetForm}>
              ✕ Cancel Edit
            </button>
          )}
        </div>

        <form className="modern-admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid-3">
            <div className="admin-input-group">
              <label htmlFor="rest-name">Restaurant Name *</label>
              <input
                id="rest-name"
                name="name"
                placeholder="e.g. Royal Spice Kitchen"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="rest-cuisine">Cuisine Specialties</label>
              <input
                id="rest-cuisine"
                name="cuisine"
                placeholder="e.g. North Indian, Biryani, Mughlai"
                value={form.cuisine}
                onChange={handleChange}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="rest-rating">Rating (0 - 5)</label>
              <input
                id="rest-rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="admin-form-grid-2">
            <div className="admin-input-group">
              <label htmlFor="rest-image">Banner / Photo Image URL</label>
              <input
                id="rest-image"
                name="image"
                placeholder="https://images.unsplash.com/..."
                value={form.image}
                onChange={handleChange}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="rest-address">Full Address &amp; City</label>
              <input
                id="rest-address"
                name="address"
                placeholder="e.g. 12 Ring Road, Civil Lines, City"
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-bottom-actions-bar">
            <label className="admin-checkbox-control">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <span>Active Partner (Accepting Orders)</span>
            </label>

            <div className="btn-group-end">
              {editingId && (
                <button type="button" className="admin-btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="admin-btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "💾 Save Restaurant" : "➕ Add Restaurant"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* RESTAURANTS CARDS GRID */}
      <div className="admin-section-heading-row">
        <h2>Registered Restaurants ({restaurants.length})</h2>
      </div>

      {loading ? (
        <div className="admin-loading-box">
          <div className="loading-spinner" />
          <p>Loading restaurants...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="admin-surface-card admin-empty-box">
          <span className="empty-state-icon">🏪</span>
          <h3>No Partner Restaurants Added</h3>
          <p>Use the form above to add your first restaurant branch.</p>
        </div>
      ) : (
        <div className="restaurants-cards-grid">
          {restaurants.map((r) => (
            <div
              className={`admin-surface-card modern-restaurant-card ${
                r.isActive === false ? "card-dimmed" : ""
              }`}
              key={r._id}
            >
              <div
                className="restaurant-card-cover"
                style={{
                  backgroundImage: `url(${
                    r.image ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"
                  })`,
                }}
              >
                <div className="cover-overlay">
                  <div className="rating-star-chip">⭐ {r.rating || "4.5"}</div>
                  <span
                    className={`admin-status-badge ${
                      r.isActive !== false ? "badge-status-delivered" : "badge-status-cancelled"
                    }`}
                  >
                    {r.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="restaurant-card-body">
                <h3 className="restaurant-card-title">{r.name}</h3>

                {r.cuisine && (
                  <span className="restaurant-cuisine-tag">{r.cuisine}</span>
                )}

                <p className="restaurant-card-address">
                  📍 {r.address || "Address not provided"}
                </p>

                <div className="card-actions-footer">
                  <button
                    type="button"
                    className="action-btn-edit"
                    onClick={() => handleEdit(r)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    className="action-btn-delete"
                    onClick={() => handleDelete(r._id, r.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageRestaurants;
