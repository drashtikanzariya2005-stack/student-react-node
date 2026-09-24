import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";

const STATUS_OPTIONS = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeDrafts, setTimeDrafts] = useState({});
  const [savingTimeId, setSavingTimeId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { showToast } = useToast();

  const loadOrders = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await adminApiFetch("/orders");
      setOrders(data || []);
      setMessage("");
    } catch (error) {
      if (!silent) setMessage(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders({ silent: true }), 10000);
    const onFocus = () => loadOrders({ silent: true });
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await adminApiFetch(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                status,
                paymentStatus:
                  status === "Cancelled" && o.paymentStatus === "Paid" && o.paymentMethod !== "COD"
                    ? "Refund Processing"
                    : o.paymentStatus,
              }
            : o
        )
      );
      showToast(`Order #${orderId.slice(-6).toUpperCase()} status updated to ${status}`, "success");
    } catch (error) {
      setMessage(error.message || "Failed to update status");
      showToast(error.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkRefunded = async (orderId) => {
    setRefundingId(orderId);
    try {
      await adminApiFetch(`/orders/${orderId}/payment-status`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus: "Refunded" }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: "Refunded" } : o))
      );
      showToast("Order payment status updated to Refunded", "success");
    } catch (error) {
      showToast(error.message || "Could not update refund status", "error");
    } finally {
      setRefundingId(null);
    }
  };

  const handleSaveETA = async (orderId) => {
    const rawVal = timeDrafts[orderId];
    if (rawVal === undefined) return;

    setSavingTimeId(orderId);
    try {
      const payloadDate = rawVal ? new Date(rawVal).toISOString() : null;
      await adminApiFetch(`/orders/${orderId}/delivery-time`, {
        method: "PUT",
        body: JSON.stringify({ estimatedDeliveryTime: payloadDate }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, estimatedDeliveryTime: payloadDate } : o))
      );
      setTimeDrafts((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      showToast("Delivery ETA updated successfully", "success");
    } catch (error) {
      showToast(error.message || "Failed to update ETA", "error");
    } finally {
      setSavingTimeId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" ||
        (order.status || "").toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order._id?.toLowerCase().includes(q) ||
        order.user?.name?.toLowerCase().includes(q) ||
        order.user?.email?.toLowerCase().includes(q) ||
        order.deliveryAddress?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <Link to="/admin" className="admin-back-breadcrumbs">
            ← Dashboard
          </Link>
          <div className="view-badge">ORDER FULFILLMENT</div>
          <h1>📦 Live Customer Orders</h1>
          <p className="view-subtitle">
            Manage incoming live orders, update kitchen &amp; delivery statuses, set ETA, and process refunds.
          </p>
        </div>

        <div className="view-action-group">
          <button
            type="button"
            className="admin-btn-secondary btn-sm"
            onClick={() => loadOrders()}
            disabled={refreshing}
          >
            {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Orders"}
          </button>
        </div>
      </div>

      {message && (
        <div className="admin-alert-banner alert-error">
          <span>⚠️</span> {message}
        </div>
      )}

      {/* STATUS TABS & SEARCH */}
      <div className="admin-surface-card filter-toolbar-card">
        <div className="status-filter-pills-row">
          {["All", "Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"].map(
            (st) => {
              const count =
                st === "All"
                  ? orders.length
                  : orders.filter((o) => o.status === st).length;

              return (
                <button
                  key={st}
                  type="button"
                  className={`status-tab-pill ${statusFilter === st ? "active-pill" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  <span>{st}</span>
                  <span className="tab-count-badge">{count}</span>
                </button>
              );
            }
          )}
        </div>

        <div className="filter-search-block">
          <input
            type="search"
            placeholder="Search by Order ID, Customer Name, or Address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="orders-feed-container">
        {loading ? (
          <div className="admin-loading-box">
            <div className="loading-spinner" />
            <p>Loading customer orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-surface-card admin-empty-box">
            <span className="empty-state-icon">📦</span>
            <h3>No Orders Found</h3>
            <p>
              {searchQuery || statusFilter !== "All"
                ? "No orders match your selected filters or search query."
                : "No customer orders have been placed yet."}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusClass = `badge-status-${(order.status || "").toLowerCase().replace(/\s+/g, "-")}`;
            const etaValue =
              timeDrafts[order._id] !== undefined
                ? timeDrafts[order._id]
                : toDatetimeLocalValue(order.estimatedDeliveryTime);

            const isPaidOnline = order.paymentMethod !== "COD";

            return (
              <div className="admin-surface-card modern-order-card" key={order._id}>
                {/* CARD HEADER */}
                <div className="order-card-header-bar">
                  <div className="order-id-customer-block">
                    <div className="order-main-tag">
                      <span className="order-hash-symbol">#</span>
                      <strong className="order-code">
                        {order._id.slice(-8).toUpperCase()}
                      </strong>
                    </div>

                    <div className="customer-quick-meta">
                      <span className="cust-name">👤 {order.user?.name || "Customer"}</span>
                      {order.user?.email && <span className="cust-dot">•</span>}
                      {order.user?.email && (
                        <span className="cust-email">{order.user.email}</span>
                      )}
                      <span className="cust-dot">•</span>
                      <span className="order-time-stamp">
                        🕒 {new Date(order.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* STATUS SELECTOR */}
                  <div className="order-status-controller">
                    <label className="status-ctrl-label">Live Status:</label>
                    <select
                      className={`admin-status-select ${statusClass}`}
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="order-card-inner-grid">
                  {/* LEFT: ORDER ITEMS */}
                  <div className="order-items-column">
                    <h4 className="column-mini-heading">Dishes Ordered ({order.items?.length || 0})</h4>
                    <div className="order-items-table-wrap">
                      <table className="order-items-mini-table">
                        <tbody>
                          {(order.items || []).map((it, idx) => (
                            <tr key={idx}>
                              <td className="item-name-col">
                                <strong>{it.name}</strong>
                              </td>
                              <td className="item-qty-col">x{it.quantity}</td>
                              <td className="item-price-col">₹{it.price * it.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {order.couponCode && (
                      <div className="order-applied-coupon-tag">
                        <span>🏷️ Coupon Applied:</span>
                        <strong>{order.couponCode}</strong>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: DELIVERY & PAYMENT DETAILS */}
                  <div className="order-delivery-payment-column">
                    <div className="info-block-box">
                      <h4 className="column-mini-heading">📍 Delivery Address</h4>
                      <p className="order-address-text">
                        {order.deliveryAddress || "No address provided"}
                      </p>
                    </div>

                    <div className="info-block-box">
                      <h4 className="column-mini-heading">💳 Payment &amp; Billing</h4>
                      <div className="payment-meta-row">
                        <span className="pm-type-badge">Method: {order.paymentMethod || "COD"}</span>
                        <span
                          className={`payment-status-badge badge-${(
                            order.paymentStatus || "Pending"
                          ).toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          Payment: {order.paymentStatus || (order.paymentMethod === "COD" ? "Pending" : "Paid")}
                        </span>
                      </div>
                      <div className="order-grand-total-row">
                        <span>Total Paid by Customer:</span>
                        <strong>₹{order.totalAmount}</strong>
                      </div>
                    </div>

                    {/* ETA SCHEDULER */}
                    <div className="info-block-box eta-box">
                      <h4 className="column-mini-heading">⏱️ Estimated Delivery Time (ETA)</h4>
                      <div className="eta-input-row">
                        <input
                          type="datetime-local"
                          className="admin-datetime-input"
                          value={etaValue}
                          onChange={(e) =>
                            setTimeDrafts({ ...timeDrafts, [order._id]: e.target.value })
                          }
                        />
                        {timeDrafts[order._id] !== undefined && (
                          <button
                            type="button"
                            className="admin-btn-primary btn-sm"
                            disabled={savingTimeId === order._id}
                            onClick={() => handleSaveETA(order._id)}
                          >
                            {savingTimeId === order._id ? "Saving..." : "Save ETA"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* REFUND CONTROLLER IF CANCELLED PAID ORDER */}
                    {order.status === "Cancelled" && isPaidOnline && (
                      <div className="order-refund-card">
                        <div className="refund-card-top">
                          <span>💸 Cancellation Refund:</span>
                          <strong>{order.paymentStatus}</strong>
                        </div>
                        {order.paymentStatus === "Refund Processing" && (
                          <button
                            type="button"
                            className="admin-btn-primary btn-sm btn-refund"
                            disabled={refundingId === order._id}
                            onClick={() => handleMarkRefunded(order._id)}
                          >
                            {refundingId === order._id ? "Processing..." : "Mark as Refunded"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManageOrders;
