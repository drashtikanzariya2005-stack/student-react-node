import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import PageTransition from "../components/PageTransition";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/foods", label: "Dishes & Menu", icon: "🍽️" },
  { to: "/admin/categories", label: "Categories", icon: "🗂️" },
  { to: "/admin/orders", label: "Customer Orders", icon: "📦" },
  { to: "/admin/restaurants", label: "Restaurants", icon: "🏪" },
  { to: "/admin/offers", label: "Promos & Offers", icon: "🎁" },
  { to: "/admin/users", label: "Manage Users", icon: "👥" },
  { to: "/admin/messages", label: "Inbox Messages", icon: "✉️" },
];

function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="brand-logo-circle">⚡</div>
          <div className="brand-titles">
            <span className="brand-title-main">FoodExpress</span>
            <span className="brand-title-sub">ADMIN PORTAL</span>
          </div>
          <button
            className="mobile-menu-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="admin-nav-section-title">MAIN NAVIGATION</div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? "admin-sidebar-link-active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="admin-user-info-text">
              <p className="admin-user-name">{user.name || "Administrator"}</p>
              <p className="admin-user-role-badge">Super Admin</p>
            </div>
          </div>

          <div className="admin-footer-btn-row">
            <button className="admin-logout-btn" onClick={handleLogout} title="Logout from Admin">
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="admin-content-wrapper">
        <header className="admin-topbar">
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open sidebar menu"
          >
            ☰
          </button>
          <div className="admin-topbar-title">
            <span className="topbar-live-dot" /> Live Admin Management
          </div>
        </header>

        <main className="admin-content">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
