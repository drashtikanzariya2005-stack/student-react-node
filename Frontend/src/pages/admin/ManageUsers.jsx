import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useToast } from "../../context/ToastContext";

const EDITABLE_FIELDS = [
  { key: "name", label: "Full Name", type: "text" },
  { key: "email", label: "Email Address", type: "email" },
  { key: "phone", label: "Phone Number", type: "tel" },
  { key: "address", label: "Default Address", type: "text" },
];

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user: currentAdmin } = useAdminAuth();
  const { showToast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminApiFetch("/users");
      setUsers(data || []);
    } catch (err) {
      setError(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const startEditing = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "user",
    });
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setForm({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminApiFetch(`/users/${editingUser._id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      showToast(`User ${form.name || ""} updated successfully`, "success");
      cancelEditing();
      await loadUsers();
    } catch (err) {
      showToast(err.message || "Could not update user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;

    try {
      await adminApiFetch(`/users/${user._id}`, { method: "DELETE" });
      showToast("User account deleted", "success");
      await loadUsers();
    } catch (err) {
      showToast(err.message || "Could not delete user", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <Link to="/admin" className="admin-back-breadcrumbs">
            ← Dashboard
          </Link>
          <div className="view-badge">ACCOUNTS &amp; PERMISSIONS</div>
          <h1>👥 User Management</h1>
          <p className="view-subtitle">
            View registered customer accounts, update details, assign Admin roles, and oversee platform activity.
          </p>
        </div>

        <div className="view-stat-pill">
          <span className="pill-number">{users.length}</span>
          <span className="pill-label">Registered Users</span>
        </div>
      </div>

      {error && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* EDIT MODAL / INLINE FORM */}
      {editingUser && (
        <div className="admin-surface-card admin-form-card fade-in-up">
          <div className="form-card-header">
            <div>
              <h2>✏️ Edit User: {editingUser.name}</h2>
              <p className="form-card-desc">
                Update customer contact details or adjust access role permissions.
              </p>
            </div>
            <button type="button" className="admin-btn-secondary btn-sm" onClick={cancelEditing}>
              ✕ Cancel
            </button>
          </div>

          <form className="modern-admin-form" onSubmit={handleSave}>
            <div className="admin-form-grid-2">
              {EDITABLE_FIELDS.map((field) => (
                <div className="admin-input-group" key={field.key}>
                  <label>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="admin-input-group">
                <label>Account Access Role</label>
                <select
                  value={form.role || "user"}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User (Regular Customer)</option>
                  <option value="admin">Admin (Full Control Access)</option>
                </select>
              </div>
            </div>

            <div className="form-bottom-actions-bar">
              <div className="btn-group-end">
                <button type="button" className="admin-btn-secondary" onClick={cancelEditing}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saving Changes..." : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH TOOLBAR */}
      <div className="admin-surface-card filter-toolbar-card">
        <div className="filter-search-block">
          <input
            type="search"
            placeholder="Search by customer name, email, phone or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="admin-surface-card admin-table-container-card">
        <div className="table-header-info">
          <h2>User Accounts ({filteredUsers.length})</h2>
          <span className="table-showing-text">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        {loading ? (
          <div className="admin-loading-box">
            <div className="loading-spinner" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-table-state">
            <span className="empty-state-icon">👥</span>
            <h3>No Users Found</h3>
            <p>Try searching for a different name or email.</p>
          </div>
        ) : (
          <div className="admin-responsive-table">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Avatar</th>
                  <th>Customer / User</th>
                  <th>Contact Info</th>
                  <th>Address</th>
                  <th>Role</th>
                  <th>Live Status</th>
                  <th style={{ width: "150px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u._id === currentAdmin?.id;
                  const firstLetter = u.name ? u.name.charAt(0).toUpperCase() : "U";

                  return (
                    <tr key={u._id} className="admin-table-row-hover">
                      <td>
                        <div className="table-user-avatar">{firstLetter}</div>
                      </td>
                      <td>
                        <strong className="table-item-primary-text">
                          {u.name}
                          {isCurrentAdmin && <span className="you-pill">(You)</span>}
                        </strong>
                        <p className="table-item-desc-text">{u.email}</p>
                      </td>
                      <td>
                        <span className="user-contact-text">{u.phone || "No phone linked"}</span>
                      </td>
                      <td>
                        <span className="user-address-snippet">
                          {u.address || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-role-badge ${
                            u.role === "admin" ? "role-admin" : "role-user"
                          }`}
                        >
                          {u.role === "admin" ? "🛡️ Admin" : "👤 Customer"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status-badge ${
                            u.isOnline ? "badge-status-delivered" : "badge-status-cancelled"
                          }`}
                        >
                          {u.isOnline ? "🟢 Online" : "⚫ Offline"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="action-btn-edit"
                            onClick={() => startEditing(u)}
                            title="Edit user"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="action-btn-delete"
                            disabled={isCurrentAdmin}
                            onClick={() => handleDelete(u)}
                            title={isCurrentAdmin ? "Cannot delete own account" : "Delete user"}
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

export default ManageUsers;
