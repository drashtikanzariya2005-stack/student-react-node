import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useToast } from "../context/ToastContext";

const statusClass = (status) => {
  const map = {
    Pending: "badge-pending",
    Preparing: "badge-preparing",
    "Out for Delivery": "badge-out",
    Delivered: "badge-delivered",
    Cancelled: "badge-cancelled",
  };
  return map[status] || "badge-pending";
};

const paymentClass = (status) => {
  const map = {
    Paid: "badge-delivered",
    Pending: "badge-pending",
    Failed: "badge-cancelled",
    "Refund Processing": "badge-preparing",
    Refunded: "badge-delivered",
  };
  return map[status] || "badge-pending";
};

// Orders can be cancelled while they are active (not Delivered or Cancelled)
const CANCELLABLE_STATUSES = ["Pending", "Preparing", "Out for Delivery"];

function MyOrders() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch("/orders/my-orders");
      setOrders(data);
    } catch (error) {
      setMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (order) => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;

    setCancellingId(order._id);
    try {
      const data = await apiFetch(`/orders/${order._id}/cancel`, {
        method: "PUT",
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? data.order : o))
      );
      showToast("Order cancelled", "success");
    } catch (error) {
      showToast(error.message || "Could not cancel order", "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="orders-page">
      <h1>📦 My Orders</h1>

      {loading && <p className="status-msg">Loading orders...</p>}
      {message && <p className="status-msg error">{message}</p>}

      {!loading && orders.length === 0 && !message && (
        <p className="status-msg">You haven't placed any orders yet.</p>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order._id}>
            <div className="order-card-header">
              <div>
                <p className="order-id">Order #{order._id.slice(-6)}</p>
                <p className="order-date">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`badge ${statusClass(order.status)}`}>
                {order.status}
              </span>
            </div>

            {!["Delivered", "Cancelled"].includes(order.status) && (
              <p className="delivery-eta">
                🕒{" "}
                {order.estimatedDeliveryTime
                  ? `Arriving by ${new Date(order.estimatedDeliveryTime).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Delivery time will be updated soon"}
              </p>
            )}

            <div className="order-items">
              {order.items.map((item, index) => (
                <p key={index} className="order-item-line">
                  {item.name} × {item.quantity} = ₹{item.price * item.quantity}
                </p>
              ))}
            </div>

            <p className="order-total">Total: ₹{order.totalAmount}</p>
            {order.discountAmount > 0 && (
              <p className="order-coupon-note">🎁 Coupon {order.offerCode} applied: − ₹{order.discountAmount}</p>
            )}

            <div className="order-meta">
              <span className="order-meta-item">
                {order.paymentMethod === "Online" ? "🔒 Paid Online" : `💳 ${order.paymentMethod || "COD"}`}
              </span>
              <span className={`badge badge-small ${paymentClass(order.paymentStatus)}`}>
                {order.paymentStatus || "Pending"}
              </span>
            </div>

            {order.paymentStatus === "Refund Processing" && (
              <p className="status-msg refund-note">
                💰 Your refund is being processed. It will reflect in your original
                payment method soon.
              </p>
            )}
            {order.paymentStatus === "Refunded" && (
              <p className="status-msg refund-note refund-done">
                ✅ Refund completed for this order.
              </p>
            )}

            {order.deliveryAddress && (
              <p className="order-address">📍 {order.deliveryAddress}</p>
            )}

            <div className="order-card-actions">
              <button className="btn-outline bill-link-btn" onClick={() => navigate(`/bill/${order._id}`)}>
                🧾 View Bill
              </button>

              {CANCELLABLE_STATUSES.includes(order.status) && (
                <button
                  className="btn-danger btn-small"
                  disabled={cancellingId === order._id}
                  onClick={() => handleCancel(order)}
                >
                  {cancellingId === order._id ? "Cancelling..." : "❌ Cancel Order"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyOrders;
