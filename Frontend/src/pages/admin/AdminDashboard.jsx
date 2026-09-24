import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";

const QUICK_LINKS = [
  { to: "/admin/foods", title: "🍽️ Manage Menu & Dishes", text: "Add, update or remove items, prices, dietary tags and photos.", badge: "Catalog" },
  { to: "/admin/categories", title: "📁 Categories & Cuisine", text: "Create and organize Main Categories and Subcategories.", badge: "Taxonomy" },
  { to: "/admin/orders", title: "📦 Customer Orders", text: "Track live incoming orders, assign status & handle refunds.", badge: "Operations" },
  { to: "/admin/restaurants", title: "🏪 Restaurant Partners", text: "Manage partner branches, ratings, and cuisines.", badge: "Vendors" },
  { to: "/admin/offers", title: "🎁 Promo Offers & Coupons", text: "Create discount promo codes and limited time deals.", badge: "Marketing" },
  { to: "/admin/users", title: "👥 User Management", text: "Manage registered customers and staff roles.", badge: "Accounts" },
  { to: "/admin/messages", title: "✉️ Customer Inquiries", text: "Review and respond to contact feedback & inquiries.", badge: "Support" },
];

const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [mainCategories, setMainCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [orders, users, foods, messages, mains, subs] = await Promise.all([
          adminApiFetch("/orders"),
          adminApiFetch("/users"),
          adminApiFetch("/foods"),
          adminApiFetch("/contact"),
          adminApiFetch("/categories/main"),
          adminApiFetch("/categories"),
        ]);

        const orderList = orders || [];
        const revenue = orderList
          .filter((order) => order.status !== "Cancelled")
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        setStats({
          orders: orderList.length,
          pendingOrders: orderList.filter((order) =>
            ["Pending", "Preparing", "Out for Delivery"].includes(order.status)
          ).length,
          deliveredOrders: orderList.filter((order) => order.status === "Delivered").length,
          revenue,
          users: (users || []).filter((u) => u.role !== "admin").length,
          foods: (foods || []).length,
          mainCategories: (mains || []).length,
          subCategories: (subs || []).length,
          newMessages: (messages || []).filter((m) => m.status === "New").length,
        });

        setMainCategories(mains || []);
        setRecentOrders(orderList.slice(0, 5));
      } catch (err) {
        setError(err.message || "Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const metricCards = stats
    ? [
        {
          label: "Total Store Revenue",
          value: currency(stats.revenue),
          icon: "💰",
          sub: `${stats.deliveredOrders} orders successfully delivered`,
          accent: "metric-accent-green",
        },
        {
          label: "Total Orders",
          value: stats.orders,
          icon: "📦",
          sub: `${stats.pendingOrders} currently in progress`,
          accent: "metric-accent-orange",
        },
        {
          label: "Menu Dishes",
          value: stats.foods,
          icon: "🍽️",
          sub: "Active dishes on the menu",
          accent: "metric-accent-blue",
        },
        {
          label: "Main Categories",
          value: stats.mainCategories,
          icon: "🗂️",
          sub: `${stats.subCategories} total subcategories`,
          accent: "metric-accent-purple",
        },
        {
          label: "Registered Customers",
          value: stats.users,
          icon: "👥",
          sub: "Customer accounts created",
          accent: "metric-accent-teal",
        },
        {
          label: "Pending Inquiries",
          value: stats.newMessages,
          icon: "✉️",
          sub: "New customer messages",
          accent: "metric-accent-amber",
        },
      ]
    : [];

  return (
    <div className="admin-page-container dashboard-page">
      {/* PAGE HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <div className="view-badge">STORE OPERATIONS</div>
          <h1>Admin Control Center</h1>
          <p className="view-subtitle">
            Welcome back! Here is a live overview of your food delivery store operations.
          </p>
        </div>

        <div className="view-action-group">
          <Link to="/admin/foods" className="admin-btn-primary">
            ➕ Add New Dish
          </Link>
          <Link to="/admin/orders" className="admin-btn-secondary">
            📦 Live Orders
          </Link>
          <Link to="/admin/categories" className="admin-btn-secondary">
            🗂️ Categories
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading && (
        <div className="admin-loading-card">
          <div className="loading-spinner" />
          <p>Loading live store metrics...</p>
        </div>
      )}

      {/* METRIC CARDS GRID */}
      {stats && (
        <div className="admin-kpi-grid">
          {metricCards.map((card) => (
            <div className={`admin-kpi-card ${card.accent}`} key={card.label}>
              <div className="kpi-card-header">
                <span className="kpi-icon-bubble">{card.icon}</span>
                <span className="kpi-live-tag">LIVE</span>
              </div>
              <div className="kpi-card-body">
                <h2 className="kpi-value-text">{card.value}</h2>
                <p className="kpi-label-text">{card.label}</p>
              </div>
              <div className="kpi-card-footer">
                <span className="kpi-sub-text">{card.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECENT ORDERS & CATEGORIES 2-COLUMN SECTION */}
      <div className="dashboard-double-section">
        {/* RECENT ORDERS FEED */}
        <div className="admin-surface-card dashboard-widget-card">
          <div className="widget-card-header">
            <div>
              <h2>📦 Recent Customer Orders</h2>
              <p className="widget-card-desc">Latest incoming orders across all food categories</p>
            </div>
            <Link to="/admin/orders" className="widget-header-link">
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="widget-empty-box">
              <p>No customer orders placed yet.</p>
            </div>
          ) : (
            <div className="recent-orders-feed-list">
              {recentOrders.map((order) => {
                const statusClass = `badge-status-${(order.status || "").toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <div className="recent-order-card-row" key={order._id}>
                    <div className="order-row-col-main">
                      <div className="order-id-badge">
                        #{order._id ? order._id.slice(-6).toUpperCase() : "ORDER"}
                      </div>
                      <div className="order-cust-info">
                        <strong>{order.user?.name || "Guest Customer"}</strong>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="order-row-items-preview">
                      {(order.items || []).map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                    </div>

                    <div className="order-row-col-end">
                      <strong className="order-amount-text">₹{order.totalAmount}</strong>
                      <span className={`admin-status-badge ${statusClass}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MAIN CATEGORIES OVERVIEW */}
        <div className="admin-surface-card dashboard-widget-card">
          <div className="widget-card-header">
            <div>
              <h2>🗂️ Cuisine &amp; Category Breakdown</h2>
              <p className="widget-card-desc">Registered primary food dietary groups</p>
            </div>
            <Link to="/admin/categories" className="widget-header-link">
              Manage All →
            </Link>
          </div>

          {mainCategories.length === 0 ? (
            <div className="widget-empty-box">
              <p>No main categories created yet.</p>
            </div>
          ) : (
            <div className="category-metric-chips-grid">
              {mainCategories.map((m) => (
                <div className="dashboard-cat-chip" key={m._id}>
                  <div className="cat-chip-icon">{m.icon || "🍽️"}</div>
                  <div className="cat-chip-text">
                    <strong className="cat-chip-title">{m.name}</strong>
                    <span className="cat-chip-count">
                      {m.subCategoryCount || 0} Subcategories
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK MANAGEMENT HUB */}
      <div className="admin-surface-card quick-hub-card">
        <div className="widget-card-header">
          <div>
            <h2>⚡ Quick Management Hub</h2>
            <p className="widget-card-desc">Jump straight to key management modules</p>
          </div>
        </div>

        <div className="quick-links-cards-grid">
          {QUICK_LINKS.map((link) => (
            <Link to={link.to} className="quick-link-nav-card" key={link.to}>
              <div className="quick-link-card-top">
                <span className="quick-link-tag">{link.badge}</span>
                <span className="quick-link-arrow">→</span>
              </div>
              <h3 className="quick-link-title">{link.title}</h3>
              <p className="quick-link-desc">{link.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
