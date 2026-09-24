import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const emptyForm = {
  title: "",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  maxDiscount: "",
  minOrder: 0,
  startDate: "",
  endDate: "",
  isActive: true,
};

function ManageOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { showToast } = useToast();

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch("/offers");
      setOffers(data || []);
    } catch (error) {
      setMessage(error.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const applyPresetDates = (preset) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const formatLocal = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;

    if (preset === "24h") {
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setForm((p) => ({
        ...p,
        startDate: formatLocal(now),
        endDate: formatLocal(end),
      }));
    } else if (preset === "weekend") {
      const start = new Date(now);
      const day = start.getDay();
      const diffToFriday = (5 - day + 7) % 7;
      start.setDate(start.getDate() + (diffToFriday === 0 && start.getHours() >= 18 ? 7 : diffToFriday));
      start.setHours(18, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      end.setHours(23, 59, 0, 0);

      setForm((p) => ({
        ...p,
        startDate: formatLocal(start),
        endDate: formatLocal(end),
      }));
    } else if (preset === "7days") {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setForm((p) => ({
        ...p,
        startDate: formatLocal(now),
        endDate: formatLocal(end),
      }));
    } else if (preset === "clear") {
      setForm((p) => ({
        ...p,
        startDate: "",
        endDate: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else if (name === "code") {
      setForm({ ...form, code: value.toUpperCase().replace(/\s+/g, "") });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      showToast("Coupon code is required", "error");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      showToast("Please enter a valid discount value", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      if (editingId) {
        await adminApiFetch(`/offers/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Offer promo code updated", "success");
      } else {
        await adminApiFetch("/offers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast(`Promo code "${payload.code}" created!`, "success");
      }

      resetForm();
      await loadOffers();
    } catch (error) {
      setMessage(error.message || "Failed to save offer");
      showToast(error.message || "Failed to save offer", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (off) => {
    setEditingId(off._id);
    setForm({
      title: off.title || "",
      code: off.code || "",
      description: off.description || "",
      discountType: off.discountType || "percent",
      discountValue: off.discountValue ?? 10,
      maxDiscount: off.maxDiscount ?? "",
      minOrder: off.minOrder ?? 0,
      startDate: toDatetimeLocalValue(off.startDate),
      endDate: toDatetimeLocalValue(off.endDate),
      isActive: off.isActive !== false,
    });
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;

    try {
      await adminApiFetch(`/offers/${id}`, { method: "DELETE" });
      showToast(`Offer "${code}" deleted`, "success");
      await loadOffers();
    } catch (error) {
      showToast(error.message || "Failed to delete offer", "error");
    }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((off) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && off.isActive !== false) ||
        (statusFilter === "inactive" && off.isActive === false);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        off.code.toLowerCase().includes(q) ||
        (off.title && off.title.toLowerCase().includes(q)) ||
        (off.description && off.description.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [offers, statusFilter, searchQuery]);

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <Link to="/admin" className="admin-back-breadcrumbs">
            ← Dashboard
          </Link>
          <div className="view-badge">DISCOUNTS &amp; MARKETING</div>
          <h1>🎁 Promo Offers &amp; Coupons</h1>
          <p className="view-subtitle">
            Create coupon codes, percentage or flat discounts, validity periods, and minimum order rules.
          </p>
        </div>

        <div className="view-stat-pill">
          <span className="pill-number">{offers.length}</span>
          <span className="pill-label">Total Coupons</span>
        </div>
      </div>

      {message && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {message}
        </div>
      )}

      {/* CREATE / EDIT OFFER FORM */}
      <div className="admin-surface-card admin-form-card">
        <div className="form-card-header">
          <div>
            <h2>{editingId ? "✏️ Edit Promo Offer" : "➕ Create New Coupon Code"}</h2>
            <p className="form-card-desc">
              {editingId
                ? "Update coupon discount values, rules, and validity window."
                : "Enter code details below. Customers can enter this promo code during cart checkout."}
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
              <label htmlFor="offer-code">Coupon Code *</label>
              <input
                id="offer-code"
                name="code"
                placeholder="e.g. FESTIVE50, WELCOME100"
                value={form.code}
                onChange={handleChange}
                required
                style={{ textTransform: "uppercase", fontWeight: "bold", letterSpacing: "1px" }}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="offer-title">Offer Title</label>
              <input
                id="offer-title"
                name="title"
                placeholder="e.g. 50% Off on First Order"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="discount-type">Discount Type</label>
              <select
                id="discount-type"
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
              >
                <option value="percent">Percentage Discount (% OFF)</option>
                <option value="flat">Flat Amount Discount (₹ OFF)</option>
              </select>
            </div>
          </div>

          <div className="admin-form-grid-3">
            <div className="admin-input-group">
              <label htmlFor="discount-val">
                {form.discountType === "percent" ? "Discount Percentage (%) *" : "Flat Discount (₹) *"}
              </label>
              <input
                id="discount-val"
                type="number"
                min="1"
                max={form.discountType === "percent" ? 100 : 5000}
                name="discountValue"
                placeholder={form.discountType === "percent" ? "20" : "100"}
                value={form.discountValue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="min-order">Minimum Order Amount (₹)</label>
              <input
                id="min-order"
                type="number"
                min="0"
                name="minOrder"
                placeholder="0 for no minimum"
                value={form.minOrder}
                onChange={handleChange}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="max-discount">Max Discount Cap (₹) {form.discountType === "percent" && "(Optional)"}</label>
              <input
                id="max-discount"
                type="number"
                min="0"
                name="maxDiscount"
                placeholder="e.g. 150 (Leave blank for no cap)"
                value={form.maxDiscount}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* DATE PICKERS & PRESETS */}
          <div className="admin-form-grid-2">
            <div className="admin-input-group">
              <label htmlFor="offer-start">Start Date &amp; Time</label>
              <input
                id="offer-start"
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="offer-end">Expiry Date &amp; Time</label>
              <input
                id="offer-end"
                type="datetime-local"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* QUICK DURATION PRESETS */}
          <div className="quick-presets-row">
            <span className="preset-label">Quick Expiry Presets:</span>
            <button
              type="button"
              className="preset-pill-btn"
              onClick={() => applyPresetDates("24h")}
            >
              ⏱️ 24 Hours
            </button>
            <button
              type="button"
              className="preset-pill-btn"
              onClick={() => applyPresetDates("weekend")}
            >
              🎉 Weekend Special
            </button>
            <button
              type="button"
              className="preset-pill-btn"
              onClick={() => applyPresetDates("7days")}
            >
              📅 7 Days
            </button>
            <button
              type="button"
              className="preset-pill-btn"
              onClick={() => applyPresetDates("clear")}
            >
              ✕ Clear Dates
            </button>
          </div>

          <div className="admin-input-group full-span">
            <label htmlFor="offer-desc">Description / Terms for Customer</label>
            <textarea
              id="offer-desc"
              name="description"
              rows={2}
              placeholder="e.g. Valid on all orders above ₹299. Maximum discount capped at ₹150."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-bottom-actions-bar">
            <label className="admin-checkbox-control">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <span>Active (Available for checkout)</span>
            </label>

            <div className="btn-group-end">
              {editingId && (
                <button type="button" className="admin-btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="admin-btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "💾 Save Coupon" : "➕ Create Promo Code"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="admin-surface-card filter-toolbar-card">
        <div className="status-filter-pills-row">
          <button
            type="button"
            className={`status-tab-pill ${statusFilter === "all" ? "active-pill" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Coupons ({offers.length})
          </button>
          <button
            type="button"
            className={`status-tab-pill ${statusFilter === "active" ? "active-pill" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active ({offers.filter((o) => o.isActive !== false).length})
          </button>
          <button
            type="button"
            className={`status-tab-pill ${statusFilter === "inactive" ? "active-pill" : ""}`}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive ({offers.filter((o) => o.isActive === false).length})
          </button>
        </div>

        <div className="filter-search-block">
          <input
            type="search"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* OFFERS GRID */}
      <div className="offers-cards-grid">
        {loading ? (
          <div className="admin-loading-box">
            <div className="loading-spinner" />
            <p>Loading promo offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="admin-surface-card admin-empty-box full-span">
            <span className="empty-state-icon">🎁</span>
            <h3>No Offers Found</h3>
            <p>Use the form above to launch your first promotional discount coupon.</p>
          </div>
        ) : (
          filteredOffers.map((off) => (
            <div
              className={`admin-surface-card modern-offer-card ${
                off.isActive === false ? "card-dimmed" : ""
              }`}
              key={off._id}
            >
              <div className="offer-card-top-bar">
                <div className="coupon-code-badge-wrap">
                  <span className="coupon-code-tag">{off.code}</span>
                  <button
                    type="button"
                    className="copy-code-mini-btn"
                    title="Copy code"
                    onClick={() => {
                      navigator.clipboard.writeText(off.code);
                      showToast(`Copied ${off.code}!`, "success");
                    }}
                  >
                    📋
                  </button>
                </div>

                <span
                  className={`admin-status-badge ${
                    off.isActive !== false ? "badge-status-delivered" : "badge-status-cancelled"
                  }`}
                >
                  {off.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="offer-card-main-body">
                <h3 className="offer-card-title">
                  {off.discountType === "percent"
                    ? `${off.discountValue}% OFF`
                    : `₹${off.discountValue} FLAT OFF`}
                </h3>

                {off.title && <p className="offer-sub-title">{off.title}</p>}

                {off.description && (
                  <p className="offer-desc-text">{off.description}</p>
                )}

                <div className="offer-meta-chips-list">
                  {off.minOrder > 0 && (
                    <span className="offer-rule-chip">Min Order: ₹{off.minOrder}</span>
                  )}
                  {off.maxDiscount && (
                    <span className="offer-rule-chip">Max Cap: ₹{off.maxDiscount}</span>
                  )}
                  {off.endDate && (
                    <span className="offer-rule-chip expiry-chip">
                      Expires: {new Date(off.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-actions-footer">
                <button
                  type="button"
                  className="action-btn-edit"
                  onClick={() => handleEdit(off)}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  className="action-btn-delete"
                  onClick={() => handleDelete(off._id, off.code)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ManageOffers;
