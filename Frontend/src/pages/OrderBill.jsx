import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, adminApiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useToast } from "../context/ToastContext";

// Payments in this project are simulated — there is no real gateway wired up,
// so the label must not claim otherwise.
const paymentLabel = (order) => {
  if (order.paymentMethod === "COD") return "Cash on Delivery";
  if (order.paymentMethod === "Online") return "Paid Online (simulated)";
  return `${order.paymentMethod} (simulated)`;
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Shows one order as an invoice.
 *
 * `admin` is true when this page is opened from inside the admin panel
 * (/admin/bill/:id). That matters because the admin panel has its OWN
 * session — using the customer's apiFetch there would send a missing or
 * wrong token and bounce the admin to the customer login page.
 */
function OrderBill({ admin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: customer } = useAuth();
  const { user: adminUser } = useAdminAuth();

  const viewer = admin ? adminUser : customer;
  const fetchOrder = admin ? adminApiFetch : apiFetch;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchOrder(`/orders/${id}`);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load this bill");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, admin]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;

    setCancelling(true);
    try {
      const data = await apiFetch(`/orders/${order._id}/cancel`, {
        method: "PUT",
      });
      setOrder(data.order);
      showToast("Order cancelled successfully", "success");
    } catch (err) {
      showToast(err.message || "Could not cancel order", "error");
    } finally {
      setCancelling(false);
    }
  };

  const goBack = () => navigate(admin ? "/admin/orders" : "/my-orders");

  if (loading) {
    return (
      <div className="bill-page">
        <p className="status-msg">Loading your bill...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bill-page">
        <p className="status-msg error">{error || "Bill not found"}</p>
        <button className="btn-primary" onClick={goBack}>
          {admin ? "Back to Admin Orders" : "Go to My Orders"}
        </button>
      </div>
    );
  }

  const isAdminViewingOthersOrder = admin && order.user?._id !== viewer?.id;

  return (
    <div className="bill-page">
      <div className="bill-card">
        <div className="bill-header">
          <div>
            <h1>🧾 Order Bill</h1>
            <p className="order-date">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <span
            className={`badge ${
              order.paymentStatus === "Paid" ? "badge-delivered" : "badge-pending"
            }`}
          >
            {order.paymentStatus}
          </span>
        </div>

        <div className="bill-meta">
          <div>
            <p className="bill-meta-label">Customer</p>
            <p className="bill-meta-value">
              {order.user?.name} ({order.user?.email})
            </p>
          </div>
          <div>
            <p className="bill-meta-label">Invoice No.</p>
            <p className="bill-meta-value">
              {order.invoiceNumber || order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="bill-meta-label">Order ID</p>
            <p className="bill-meta-value">#{order._id.slice(-6)}</p>
          </div>
          {!["Delivered", "Cancelled"].includes(order.status) && (
            <div>
              <p className="bill-meta-label">Estimated Delivery</p>
              <p className="bill-meta-value">
                {order.estimatedDeliveryTime
                  ? formatDateTime(order.estimatedDeliveryTime)
                  : "To be updated"}
              </p>
            </div>
          )}
          <div>
            <p className="bill-meta-label">Payment Method</p>
            <p className="bill-meta-value">{paymentLabel(order)}</p>
          </div>
        </div>

        {order.deliveryAddress && <p className="order-address">📍 {order.deliveryAddress}</p>}

        <table className="bill-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>₹{item.price}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bill-breakdown">
          <div className="bill-row">
            <span>Subtotal</span>
            <span>₹{order.subtotal ?? order.totalAmount}</span>
          </div>
          <div className="bill-row">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee ? `₹${order.deliveryFee}` : "FREE"}</span>
          </div>
          <div className="bill-row">
            <span>GST (5%)</span>
            <span>₹{order.tax ?? 0}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="bill-row bill-row-discount">
              <span>Coupon ({order.offerCode})</span>
              <span>− ₹{order.discountAmount}</span>
            </div>
          )}
        </div>

        <div className="cart-total">
          <h2>Grand Total: ₹{order.totalAmount}</h2>
        </div>

        {order.paymentId && <p className="payment-note">Payment Ref: {order.paymentId}</p>}

        <div className="bill-actions">
          {isAdminViewingOthersOrder ? (
            <button className="btn-outline" onClick={goBack}>
              Back to Admin Orders
            </button>
          ) : (
            <>
              {!["Delivered", "Cancelled"].includes(order.status) && (
                <button
                  className="btn-danger"
                  disabled={cancelling}
                  onClick={handleCancelOrder}
                >
                  {cancelling ? "Cancelling..." : "❌ Cancel Order"}
                </button>
              )}
              <button className="btn-outline" onClick={() => navigate("/my-orders")}>
                View All Orders
              </button>
              <button className="btn-outline" onClick={() => navigate("/menu")}>
                Order Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderBill;
