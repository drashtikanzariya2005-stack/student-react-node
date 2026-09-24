import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";
import { useAdminAuth } from "../../context/AdminAuthContext";

const EMOJI_PRESETS = [
  "🟢", "🔴", "🟡", "🥤", "🍔", "🍕", "🍜", "🍰",
  "🥞", "🍛", "🥗", "🍦", "☕", "🍱", "🌮", "🍩", "🍗", "🥪"
];

const emptyMainForm = {
  name: "",
  icon: "🍽️",
  image: "",
  description: "",
  isActive: true,
  order: 0,
};

const emptySubForm = {
  mainCategory: "",
  name: "",
  image: "",
  description: "",
  isActive: true,
  order: 0,
};

function ManageCategories() {
  const [activeTab, setActiveTab] = useState("main"); // 'main' | 'sub'
  const [mainCategories, setMainCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Main Category state
  const [mainForm, setMainForm] = useState(emptyMainForm);
  const [editingMainId, setEditingMainId] = useState(null);
  const [editMainForm, setEditMainForm] = useState(emptyMainForm);
  const [savingMain, setSavingMain] = useState(false);

  // Sub Category state
  const [subForm, setSubForm] = useState(emptySubForm);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubForm, setEditSubForm] = useState(emptySubForm);
  const [savingSub, setSavingSub] = useState(false);

  // Filters
  const [selectedMainFilter, setSelectedMainFilter] = useState("All");
  const [subSearchQuery, setSubSearchQuery] = useState("");

  const { showToast } = useToast();
  const { user } = useAdminAuth();

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [mains, subs] = await Promise.all([
        adminApiFetch("/categories/main"),
        adminApiFetch("/categories"),
      ]);

      const mainList = mains || [];
      const subList = subs || [];

      setMainCategories(mainList);
      setCategories(subList);

      if (mainList.length > 0 && !subForm.mainCategory) {
        setSubForm((prev) => ({ ...prev, mainCategory: mainList[0].name }));
      }
    } catch (error) {
      setMessage(error.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubcategories = useMemo(() => {
    return categories.filter((sub) => {
      const matchesMain =
        selectedMainFilter === "All" ||
        sub.mainCategory?.toLowerCase() === selectedMainFilter.toLowerCase();
      const matchesSearch =
        !subSearchQuery.trim() ||
        sub.name.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
        sub.description?.toLowerCase().includes(subSearchQuery.toLowerCase());
      return matchesMain && matchesSearch;
    });
  }, [categories, selectedMainFilter, subSearchQuery]);

  // MAIN CATEGORY HANDLERS
  const handleMainSubmit = async (e) => {
    e.preventDefault();
    if (!mainForm.name.trim()) {
      showToast("Main category name is required", "error");
      return;
    }

    setSavingMain(true);
    try {
      await adminApiFetch("/categories/main", {
        method: "POST",
        body: JSON.stringify({
          ...mainForm,
          name: mainForm.name.trim(),
          order: Number(mainForm.order) || 0,
        }),
      });
      showToast(`Main Category "${mainForm.name}" created!`, "success");
      setMainForm(emptyMainForm);
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to create main category", "error");
    } finally {
      setSavingMain(false);
    }
  };

  const handleStartEditMain = (main) => {
    setEditingMainId(main._id);
    setEditMainForm({
      name: main.name,
      icon: main.icon || "🍽️",
      image: main.image || "",
      description: main.description || "",
      isActive: main.isActive !== false,
      order: main.order || 0,
    });
  };

  const handleUpdateMain = async (e) => {
    e.preventDefault();
    if (!editMainForm.name.trim()) {
      showToast("Main category name is required", "error");
      return;
    }

    setSavingMain(true);
    try {
      await adminApiFetch(`/categories/main/${editingMainId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editMainForm,
          name: editMainForm.name.trim(),
          order: Number(editMainForm.order) || 0,
        }),
      });
      showToast("Main category updated successfully", "success");
      setEditingMainId(null);
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to update main category", "error");
    } finally {
      setSavingMain(false);
    }
  };

  const handleDeleteMain = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Dishes linked to this main category may need updating.`)) {
      return;
    }

    try {
      await adminApiFetch(`/categories/main/${id}`, { method: "DELETE" });
      showToast(`Main category "${name}" deleted`, "success");
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to delete main category", "error");
    }
  };

  // SUBCATEGORY HANDLERS
  const handleSubSubmit = async (e) => {
    e.preventDefault();
    if (!subForm.name.trim()) {
      showToast("Subcategory name is required", "error");
      return;
    }
    if (!subForm.mainCategory) {
      showToast("Please select a parent Main Category", "error");
      return;
    }

    setSavingSub(true);
    try {
      await adminApiFetch("/categories", {
        method: "POST",
        body: JSON.stringify({
          ...subForm,
          name: subForm.name.trim(),
          order: Number(subForm.order) || 0,
        }),
      });
      showToast(`Subcategory "${subForm.name}" created!`, "success");
      setSubForm({
        ...emptySubForm,
        mainCategory: mainCategories.length > 0 ? mainCategories[0].name : "",
      });
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to create subcategory", "error");
    } finally {
      setSavingSub(false);
    }
  };

  const handleStartEditSub = (sub) => {
    setEditingSubId(sub._id);
    setEditSubForm({
      mainCategory: sub.mainCategory || (mainCategories[0]?.name || ""),
      name: sub.name,
      image: sub.image || "",
      description: sub.description || "",
      isActive: sub.isActive !== false,
      order: sub.order || 0,
    });
  };

  const handleUpdateSub = async (e) => {
    e.preventDefault();
    if (!editSubForm.name.trim()) {
      showToast("Subcategory name is required", "error");
      return;
    }

    setSavingSub(true);
    try {
      await adminApiFetch(`/categories/${editingSubId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editSubForm,
          name: editSubForm.name.trim(),
          order: Number(editSubForm.order) || 0,
        }),
      });
      showToast("Subcategory updated successfully", "success");
      setEditingSubId(null);
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to update subcategory", "error");
    } finally {
      setSavingSub(false);
    }
  };

  const handleDeleteSub = async (id, name) => {
    if (!window.confirm(`Delete subcategory "${name}"?`)) return;

    try {
      await adminApiFetch(`/categories/${id}`, { method: "DELETE" });
      showToast(`Subcategory "${name}" deleted`, "success");
      await loadData();
    } catch (error) {
      showToast(error.message || "Failed to delete subcategory", "error");
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
          <div className="view-badge">CATEGORY TAXONOMY</div>
          <h1>🗂️ Manage Categories &amp; Cuisines</h1>
          <p className="view-subtitle">
            Organize dishes into Main Categories (e.g. Veg, Non-Veg, Jain, Beverages) and Subcategories (e.g. Biryani, Pizza, Starters).
          </p>
        </div>

        <div className="view-stat-pill-group">
          <div className="view-stat-pill">
            <span className="pill-number">{mainCategories.length}</span>
            <span className="pill-label">Main Groups</span>
          </div>
          <div className="view-stat-pill">
            <span className="pill-number">{categories.length}</span>
            <span className="pill-label">Subcategories</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {message}
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="admin-tab-bar">
        <button
          type="button"
          className={`admin-tab-item ${activeTab === "main" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("main")}
        >
          <span className="tab-icon">🗂️</span> Main Categories ({mainCategories.length})
        </button>
        <button
          type="button"
          className={`admin-tab-item ${activeTab === "sub" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("sub")}
        >
          <span className="tab-icon">📁</span> Subcategories ({categories.length})
        </button>
      </div>

      {/* ===================== TAB 1: MAIN CATEGORIES ===================== */}
      {activeTab === "main" && (
        <div className="tab-content-pane fade-in-up">
          {/* CREATE MAIN FORM */}
          <div className="admin-surface-card admin-form-card">
            <div className="form-card-header">
              <div>
                <h2>➕ Add New Main Category</h2>
                <p className="form-card-desc">
                  Create primary dietary or cuisine groups (e.g., Pure Veg, Non-Veg, Jain Food, Chinese, Beverages).
                </p>
              </div>
            </div>

            <form className="modern-admin-form" onSubmit={handleMainSubmit}>
              <div className="admin-form-grid-3">
                <div className="admin-input-group">
                  <label htmlFor="main-name">Category Name *</label>
                  <input
                    id="main-name"
                    placeholder="e.g. Pure Veg, Non-Veg, Drinks"
                    value={mainForm.name}
                    onChange={(e) => setMainForm({ ...mainForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-input-group">
                  <label htmlFor="main-icon">Category Icon (Emoji)</label>
                  <div className="emoji-picker-row">
                    <input
                      id="main-icon"
                      className="emoji-input-box"
                      value={mainForm.icon}
                      onChange={(e) => setMainForm({ ...mainForm, icon: e.target.value })}
                      maxLength={4}
                    />
                    <div className="emoji-preset-pills">
                      {EMOJI_PRESETS.slice(0, 10).map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="emoji-quick-btn"
                          onClick={() => setMainForm({ ...mainForm, icon: em })}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-input-group">
                  <label htmlFor="main-image">Cover Banner Image URL</label>
                  <input
                    id="main-image"
                    placeholder="https://images.unsplash.com/..."
                    value={mainForm.image}
                    onChange={(e) => setMainForm({ ...mainForm, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-input-group full-span">
                <label htmlFor="main-desc">Description</label>
                <textarea
                  id="main-desc"
                  rows={2}
                  placeholder="Brief note about this dietary classification..."
                  value={mainForm.description}
                  onChange={(e) => setMainForm({ ...mainForm, description: e.target.value })}
                />
              </div>

              <div className="form-bottom-actions-bar">
                <label className="admin-checkbox-control">
                  <input
                    type="checkbox"
                    checked={mainForm.isActive}
                    onChange={(e) => setMainForm({ ...mainForm, isActive: e.target.checked })}
                  />
                  <span>Active &amp; Visible to Customers</span>
                </label>

                <button type="submit" className="admin-btn-primary" disabled={savingMain}>
                  {savingMain ? "Saving..." : "➕ Create Main Category"}
                </button>
              </div>
            </form>
          </div>

          {/* MAIN CATEGORIES GRID */}
          <div className="admin-section-heading-row">
            <h2>Registered Main Categories ({mainCategories.length})</h2>
            <span className="section-note-text">
              Dishes and subcategories link directly to these groups
            </span>
          </div>

          {loading ? (
            <div className="admin-loading-box">
              <div className="loading-spinner" />
              <p>Loading main categories...</p>
            </div>
          ) : mainCategories.length === 0 ? (
            <div className="admin-surface-card admin-empty-box">
              <p>No main categories found. Create one using the form above.</p>
            </div>
          ) : (
            <div className="main-cat-cards-grid">
              {mainCategories.map((m) => {
                const isEditing = editingMainId === m._id;

                if (isEditing) {
                  return (
                    <div className="admin-surface-card editing-card-surface" key={m._id}>
                      <div className="editing-card-header">
                        <h3>✏️ Edit Main Category: {m.name}</h3>
                        <button
                          type="button"
                          className="admin-btn-secondary btn-sm"
                          onClick={() => setEditingMainId(null)}
                        >
                          ✕ Cancel
                        </button>
                      </div>

                      <form onSubmit={handleUpdateMain} className="modern-admin-form">
                        <div className="admin-form-grid-2">
                          <div className="admin-input-group">
                            <label>Name</label>
                            <input
                              value={editMainForm.name}
                              onChange={(e) =>
                                setEditMainForm({ ...editMainForm, name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="admin-input-group">
                            <label>Icon</label>
                            <input
                              value={editMainForm.icon}
                              onChange={(e) =>
                                setEditMainForm({ ...editMainForm, icon: e.target.value })
                              }
                            />
                          </div>
                          <div className="admin-input-group full-span">
                            <label>Cover Image URL</label>
                            <input
                              value={editMainForm.image}
                              onChange={(e) =>
                                setEditMainForm({ ...editMainForm, image: e.target.value })
                              }
                            />
                          </div>
                          <div className="admin-input-group full-span">
                            <label>Description</label>
                            <textarea
                              rows={2}
                              value={editMainForm.description}
                              onChange={(e) =>
                                setEditMainForm({ ...editMainForm, description: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="form-bottom-actions-bar">
                          <label className="admin-checkbox-control">
                            <input
                              type="checkbox"
                              checked={editMainForm.isActive}
                              onChange={(e) =>
                                setEditMainForm({
                                  ...editMainForm,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                            <span>Active</span>
                          </label>

                          <button
                            type="submit"
                            className="admin-btn-primary"
                            disabled={savingMain}
                          >
                            {savingMain ? "Saving..." : "💾 Save Changes"}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div
                    className={`admin-surface-card modern-main-cat-card ${
                      m.isActive === false ? "card-dimmed" : ""
                    }`}
                    key={m._id}
                  >
                    <div
                      className="main-cat-card-cover"
                      style={{
                        backgroundImage: `url(${
                          m.image ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                        })`,
                      }}
                    >
                      <div className="cover-overlay">
                        <span className="main-cat-icon-chip">{m.icon || "🍽️"}</span>
                        <span
                          className={`admin-status-badge ${
                            m.isActive !== false ? "badge-status-delivered" : "badge-status-cancelled"
                          }`}
                        >
                          {m.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="main-cat-card-content">
                      <div className="main-cat-card-title-row">
                        <h3>{m.name}</h3>
                        <span className="subcat-counter-tag">
                          {m.subCategoryCount || 0} Subs
                        </span>
                      </div>

                      <p className="main-cat-card-desc">
                        {m.description || "No description provided."}
                      </p>

                      <div className="card-actions-footer">
                        <button
                          type="button"
                          className="action-btn-edit"
                          onClick={() => handleStartEditMain(m)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="action-btn-delete"
                          onClick={() => handleDeleteMain(m._id, m.name)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: SUBCATEGORIES ===================== */}
      {activeTab === "sub" && (
        <div className="tab-content-pane fade-in-up">
          {/* CREATE SUBCATEGORY FORM */}
          <div className="admin-surface-card admin-form-card">
            <div className="form-card-header">
              <div>
                <h2>➕ Add New Subcategory</h2>
                <p className="form-card-desc">
                  Create specific food genres or dish categories (e.g. Biryani, Pizzas, Burgers, Shakes, Desserts).
                </p>
              </div>
            </div>

            <form className="modern-admin-form" onSubmit={handleSubSubmit}>
              <div className="admin-form-grid-3">
                <div className="admin-input-group">
                  <label htmlFor="sub-main-select">Parent Main Category *</label>
                  <select
                    id="sub-main-select"
                    value={subForm.mainCategory}
                    onChange={(e) => setSubForm({ ...subForm, mainCategory: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Main Category --</option>
                    {mainCategories.map((m) => (
                      <option key={m._id} value={m.name}>
                        {m.icon || "🍽️"} {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-input-group">
                  <label htmlFor="sub-name">Subcategory Name *</label>
                  <input
                    id="sub-name"
                    placeholder="e.g. Biryani, Wraps, Pasta"
                    value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-input-group">
                  <label htmlFor="sub-image">Subcategory Image URL</label>
                  <div className="subcat-image-input-row">
                    <input
                      id="sub-image"
                      placeholder="https://images.unsplash.com/..."
                      value={subForm.image}
                      onChange={(e) => setSubForm({ ...subForm, image: e.target.value })}
                    />
                    {subForm.image && (
                      <div className="subcat-input-img-preview" title="Live Preview">
                        <img
                          src={subForm.image}
                          alt="preview"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-input-group full-span">
                <label htmlFor="sub-desc">Description</label>
                <textarea
                  id="sub-desc"
                  rows={2}
                  placeholder="Appetizing description for customer browsing..."
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                />
              </div>

              <div className="form-bottom-actions-bar">
                <label className="admin-checkbox-control">
                  <input
                    type="checkbox"
                    checked={subForm.isActive}
                    onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
                  />
                  <span>Active &amp; Visible in Menu Filters</span>
                </label>

                <button type="submit" className="admin-btn-primary" disabled={savingSub}>
                  {savingSub ? "Saving..." : "➕ Create Subcategory"}
                </button>
              </div>
            </form>
          </div>

          {/* FILTER & VIEW TOOLBAR */}
          <div className="admin-surface-card filter-toolbar-card">
            <div className="filter-item-block">
              <label>Filter by Main Group:</label>
              <select
                value={selectedMainFilter}
                onChange={(e) => setSelectedMainFilter(e.target.value)}
              >
                <option value="All">All Main Groups ({categories.length})</option>
                {mainCategories.map((m) => (
                  <option key={m._id} value={m.name}>
                    {m.icon || "🍽️"} {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-search-block">
              <label>Search Subcategories:</label>
              <input
                type="search"
                placeholder="Search subcategory name or description..."
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
              />
            </div>

            {(selectedMainFilter !== "All" || subSearchQuery) && (
              <button
                type="button"
                className="admin-btn-secondary btn-sm clear-btn"
                onClick={() => {
                  setSelectedMainFilter("All");
                  setSubSearchQuery("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* EDITING MODAL / CARD FOR SUBCATEGORY */}
          {editingSubId && (
            <div className="admin-surface-card editing-subcat-modal-card fade-in-up">
              <div className="editing-card-header">
                <h3>✏️ Edit Subcategory: {editSubForm.name}</h3>
                <button
                  type="button"
                  className="admin-btn-secondary btn-sm"
                  onClick={() => setEditingSubId(null)}
                >
                  ✕ Cancel
                </button>
              </div>

              <form onSubmit={handleUpdateSub} className="modern-admin-form">
                <div className="admin-form-grid-3">
                  <div className="admin-input-group">
                    <label>Parent Main Category</label>
                    <select
                      value={editSubForm.mainCategory}
                      onChange={(e) =>
                        setEditSubForm({
                          ...editSubForm,
                          mainCategory: e.target.value,
                        })
                      }
                      required
                    >
                      {mainCategories.map((m) => (
                        <option key={m._id} value={m.name}>
                          {m.icon || "🍽️"} {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-input-group">
                    <label>Subcategory Name</label>
                    <input
                      value={editSubForm.name}
                      onChange={(e) =>
                        setEditSubForm({ ...editSubForm, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="admin-input-group">
                    <label>Image URL</label>
                    <div className="subcat-image-input-row">
                      <input
                        value={editSubForm.image}
                        onChange={(e) =>
                          setEditSubForm({ ...editSubForm, image: e.target.value })
                        }
                      />
                      {editSubForm.image && (
                        <div className="subcat-input-img-preview" title="Live Preview">
                          <img
                            src={editSubForm.image}
                            alt="preview"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-input-group full-span">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={editSubForm.description}
                    onChange={(e) =>
                      setEditSubForm({
                        ...editSubForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-bottom-actions-bar">
                  <label className="admin-checkbox-control">
                    <input
                      type="checkbox"
                      checked={editSubForm.isActive}
                      onChange={(e) =>
                        setEditSubForm({
                          ...editSubForm,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    <span>Active &amp; Visible in Storefront</span>
                  </label>

                  <div className="btn-group-end">
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setEditingSubId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="admin-btn-primary"
                      disabled={savingSub}
                    >
                      {savingSub ? "Saving..." : "💾 Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SUBCATEGORIES LISTING */}
          {loading ? (
            <div className="admin-loading-box">
              <div className="loading-spinner" />
              <p>Loading subcategories...</p>
            </div>
          ) : filteredSubcategories.length === 0 ? (
            <div className="admin-surface-card admin-empty-box">
              <span className="empty-state-icon">📁</span>
              <h3>No Subcategories Found</h3>
              <p>Try clearing filters or add a new subcategory using the form above.</p>
            </div>
          ) : (
            /* =================== SUB-CATEGORIES COMPACT GRID VIEW =================== */
            <div className="subcat-cards-grid">
              {filteredSubcategories.map((sub) => {
                const isSelected = editingSubId === sub._id;
                return (
                  <div
                    key={sub._id}
                    className={`admin-surface-card modern-subcat-card ${
                      sub.isActive === false ? "card-dimmed" : ""
                    } ${isSelected ? "card-selected-highlight" : ""}`}
                  >
                    <div className="subcat-card-top-row">
                      {/* COMPACT CONTROLLED THUMBNAIL (Max 48px) */}
                      <div className="subcat-thumb-box">
                        {sub.image ? (
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="subcat-card-img"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="subcat-fallback-icon"
                          style={{ display: sub.image ? "none" : "flex" }}
                        >
                          🍴
                        </div>
                      </div>

                      <div className="subcat-info-col">
                        <div className="subcat-title-and-badge">
                          <h3 className="subcat-name-title">{sub.name}</h3>
                          <span
                            className={`admin-status-badge ${
                              sub.isActive !== false
                                ? "badge-status-delivered"
                                : "badge-status-cancelled"
                            }`}
                          >
                            {sub.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="subcat-meta-pills">
                          <span className="admin-maincat-tag">
                            🏷️ {sub.mainCategory || "General"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {sub.description && (
                      <p className="subcat-card-description">{sub.description}</p>
                    )}

                    <div className="subcat-card-actions-bar">
                      <button
                        type="button"
                        className="action-btn-edit"
                        onClick={() => handleStartEditSub(sub)}
                        title="Edit subcategory"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="action-btn-delete"
                        onClick={() => handleDeleteSub(sub._id, sub.name)}
                        title="Delete subcategory"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageCategories;
