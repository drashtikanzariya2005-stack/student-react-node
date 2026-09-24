import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery", icon: "💵", desc: "Pay cash at your doorstep" },
  { id: "UPI", label: "UPI (GPay / PhonePe / Paytm)", icon: "📱", desc: "Fast & secure instant UPI" },
  { id: "Card", label: "Credit / Debit Card", icon: "💳", desc: "Visa, Mastercard, RuPay" },
];

const DELIVERY_FEE = 40;
const FREE_DELIVERY_ABOVE = 500;
const GST_RATE = 0.05;

function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, increaseQuantity, decreaseQuantity, removeItem, clearCart, totalAmount } =
    useCart();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [upiId, setUpiId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");

  // Coupon / offer state
  const [couponInput, setCouponInput] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [showCouponsList, setShowCouponsList] = useState(false);

  // Fetch active offers
  useEffect(() => {
    apiFetch("/offers?activeOnly=true")
      .then((data) => setAvailableOffers(data || []))
      .catch(() => setAvailableOffers([]));
  }, []);

  const deliveryFee = totalAmount === 0 || totalAmount >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const tax = Math.round(totalAmount * GST_RATE * 100) / 100;
  const baseTotal = Math.round((totalAmount + deliveryFee + tax) * 100) / 100;

  // Discount calculation
  const discount = (() => {
    if (!appliedOffer) return 0;
    if (totalAmount < appliedOffer.minOrder) return 0;

    let raw =
      appliedOffer.discountType === "percent"
        ? (totalAmount * appliedOffer.discountValue) / 100
        : appliedOffer.discountValue;

    if (appliedOffer.maxDiscount && Number(appliedOffer.maxDiscount) > 0) {
      raw = Math.min(raw, Number(appliedOffer.maxDiscount));
    }

    return Math.round(Math.min(raw, baseTotal) * 100) / 100;
  })();

  const grandTotal = Math.round((baseTotal - discount) * 100) / 100;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_ABOVE - totalAmount);
  const deliveryProgress = Math.min(100, Math.round((totalAmount / FREE_DELIVERY_ABOVE) * 100));

  const handleApplyCoupon = async (codeToApply = null) => {
    const code = (typeof codeToApply === "string" ? codeToApply : couponInput).trim();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponMessage("");

    try {
      const data = await apiFetch("/offers/validate", {
        method: "POST",
        body: JSON.stringify({ code, amount: totalAmount }),
      });

      setAppliedOffer({
        code: data.offer.code,
        discountType: data.offer.discountType,
        discountValue: data.offer.discountValue,
        maxDiscount: data.offer.maxDiscount,
        minOrder: data.offer.minOrder,
      });
      setCouponInput(data.offer.code);
      setCouponMessage(`🎉 Coupon ${data.offer.code} applied! Saved ₹${data.discount}`);
      showToast(`Coupon ${data.offer.code} applied!`, "success");
      setShowCouponsList(false);
    } catch (error) {
      setAppliedOffer(null);
      setCouponMessage(error.message || "Invalid coupon code");
      showToast(error.message || "Invalid coupon code", "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponInput("");
    setCouponMessage("");
  };

  const finalizeOrder = async ({ paymentId = "" } = {}) => {
    const orderItems = cart.map((item) => ({
      food: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const data = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: orderItems,
        paymentMethod,
        paymentId,
        deliveryAddress,
        couponCode: appliedOffer ? appliedOffer.code : undefined,
      }),
    });

    setMessage("Order placed successfully! 🎉");
    showToast("Order placed successfully!", "success");
    clearCart();
    navigate(`/bill/${data.order._id}`);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast("Please login before placing an order", "error");
      navigate("/login");
      return;
    }

    if (cart.length === 0) return;

    if (!deliveryAddress.trim()) {
      showToast("Please enter a delivery address", "error");
      return;
    }

    if (paymentMethod === "Card" && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv)) {
      showToast("Please enter your card details", "error");
      return;
    }

    if (paymentMethod === "UPI" && !upiId.trim()) {
      showToast("Please enter your UPI ID (e.g. name@okhdfcbank)", "error");
      return;
    }

    setPlacing(true);
    setMessage("");

    try {
      if (paymentMethod === "COD") {
        await finalizeOrder();
      } else {
        const payResult = await apiFetch("/orders/pay", {
          method: "POST",
          body: JSON.stringify({ amount: grandTotal, method: paymentMethod }),
        });
        showToast("Payment simulation successful", "success");
        await finalizeOrder({ paymentId: payResult.paymentId });
      }
    } catch (error) {
      setMessage(error.message || "Could not place order");
      showToast(error.message || "Could not place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="cart-page-wrapper">
      <div className="cart-header-section">
        <div className="cart-title-group">
          <h1>🛒 Shopping Cart</h1>
          <p className="cart-subtitle">
            Review your delicious food items and proceed to secure checkout
          </p>
        </div>
        {cart.length > 0 && (
          <div className="cart-items-counter-badge">
            <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
          </div>
        )}
      </div>

      {message && <p className="status-msg success">{message}</p>}

      {cart.length === 0 ? (
        <div className="empty-cart-card">
          <div className="empty-cart-icon">🛍️</div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any appetizing dishes to your cart yet.</p>
          <div className="empty-cart-actions">
            <Link to="/menu" className="btn-primary">
              🍽️ Explore Menu
            </Link>
            <Link to="/offers" className="btn-outline">
              🎁 View Special Offers
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout-grid">
          {/* LEFT COLUMN: ITEMS LIST & DELIVERY INFO */}
          <div className="cart-main-column">
            {/* Free Delivery Banner */}
            <div className="free-delivery-card">
              <div className="free-delivery-header">
                <span className="delivery-icon">🚚</span>
                <div className="delivery-text">
                  {amountNeededForFreeDelivery > 0 ? (
                    <p>
                      Add <strong>₹{amountNeededForFreeDelivery}</strong> more to get{" "}
                      <span className="free-delivery-tag">FREE DELIVERY</span>!
                    </p>
                  ) : (
                    <p className="free-unlocked">
                      🎉 <strong>Awesome!</strong> You've unlocked <strong>FREE DELIVERY</strong>!
                    </p>
                  )}
                </div>
              </div>
              <div className="delivery-progress-track">
                <div
                  className="delivery-progress-fill"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-container">
              <div className="cart-items-header">
                <h2>Dishes in your order ({cart.length})</h2>
                <button
                  type="button"
                  className="clear-cart-text-btn"
                  onClick={() => {
                    if (window.confirm("Clear all items from your cart?")) clearCart();
                  }}
                >
                  Clear All
                </button>
              </div>

              <div className="cart-items-list">
                {cart.map((item) => (
                  <div className="modern-cart-item" key={item._id}>
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160"
                      }
                      alt={item.name}
                      className="cart-item-image"
                    />

                    <div className="cart-item-details">
                      <div className="cart-item-title-row">
                        <h3 className="cart-item-name">{item.name}</h3>
                        <span className="cart-item-unit-price">₹{item.price} each</span>
                      </div>

                      {item.category && (
                        <span className="cart-item-cat-pill">{item.category}</span>
                      )}

                      <div className="cart-item-bottom-row">
                        <div className="stepper-quantity-control">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => decreaseQuantity(item._id)}
                            className="stepper-btn"
                          >
                            −
                          </button>
                          <span className="stepper-value">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => increaseQuantity(item._id)}
                            className="stepper-btn"
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-item-price-block">
                          <span className="cart-item-total-price">
                            ₹{item.price * item.quantity}
                          </span>
                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            title="Remove from cart"
                            onClick={() => removeItem(item._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-continue-strip">
                <Link to="/menu" className="btn-outline btn-small">
                  ← Add More Dishes
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CHECKOUT SUMMARY & PAYMENT */}
          <div className="cart-sidebar-column">
            <div className="checkout-summary-card">
              <h2>Order Summary</h2>

              {/* Delivery Address Section */}
              <div className="checkout-section-group">
                <label className="checkout-field-label">
                  <span>📍 Delivery Address</span>
                  {user && (
                    <span className="user-auto-tag">
                      {deliveryAddress === user.address ? "From profile" : "Custom"}
                    </span>
                  )}
                </label>
                <textarea
                  className="modern-address-input"
                  rows={3}
                  placeholder="Flat/House No., Building, Street, Landmark, City, Pincode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              {/* Payment Method Selector (No "Pay Online" option!) */}
              <div className="checkout-section-group">
                <label className="checkout-field-label">
                  <span>💳 Payment Method</span>
                </label>
                <div className="modern-payment-grid">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <div
                        key={pm.id}
                        className={`payment-method-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setPaymentMethod(pm.id)}
                      >
                        <div className="payment-card-top">
                          <span className="pm-icon">{pm.icon}</span>
                          <strong className="pm-title">{pm.label}</strong>
                          <span className={`pm-radio ${isSelected ? "checked" : ""}`} />
                        </div>
                        <p className="pm-desc">{pm.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive payment details if UPI/Card */}
              {paymentMethod === "Card" && (
                <div className="payment-subform-box fade-in-up">
                  <div className="form-group-compact">
                    <label>Card Number</label>
                    <input
                      placeholder="4532 •••• •••• 8910"
                      maxLength={19}
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group-compact">
                      <label>Expiry Date</label>
                      <input
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      />
                    </div>
                    <div className="form-group-compact">
                      <label>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="pm-simulation-note">
                    🔒 Demo payment simulation — no real monetary charges occur.
                  </p>
                </div>
              )}

              {paymentMethod === "UPI" && (
                <div className="payment-subform-box fade-in-up">
                  <div className="form-group-compact">
                    <label>UPI ID / VPA</label>
                    <input
                      placeholder="username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  <p className="pm-simulation-note">
                    📱 Simulated instant UPI verification &amp; order confirmation.
                  </p>
                </div>
              )}

              {/* Coupon Section */}
              <div className="checkout-coupon-box">
                <div className="coupon-box-top">
                  <span className="coupon-box-title">🎁 Apply Promo Code</span>
                  {availableOffers.length > 0 && (
                    <button
                      type="button"
                      className="view-offers-link-btn"
                      onClick={() => setShowCouponsList(!showCouponsList)}
                    >
                      {showCouponsList
                        ? "Hide offers ▲"
                        : `${availableOffers.length} available ▼`}
                    </button>
                  )}
                </div>

                {/* Available Offers Quick Picker */}
                {showCouponsList && availableOffers.length > 0 && (
                  <div className="available-offers-drawer fade-in-up">
                    {availableOffers.map((off) => (
                      <div className="mini-coupon-card" key={off._id}>
                        <div className="mini-coupon-left">
                          <span className="mini-coupon-code">{off.code}</span>
                          <span className="mini-coupon-details">
                            {off.discountType === "percent"
                              ? `${off.discountValue}% OFF`
                              : `₹${off.discountValue} OFF`}
                            {off.minOrder > 0 ? ` · Min ₹${off.minOrder}` : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="apply-mini-btn"
                          onClick={() => handleApplyCoupon(off.code)}
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {appliedOffer ? (
                  <div className="coupon-applied-badge">
                    <div className="applied-tag-left">
                      <span className="tick-circle">✓</span>
                      <div>
                        <strong>{appliedOffer.code}</strong>
                        <p>Coupon applied successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-coupon-btn"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-group">
                    <input
                      placeholder="ENTER COUPON CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      className="apply-coupon-btn"
                      onClick={() => handleApplyCoupon()}
                      disabled={applyingCoupon || !couponInput.trim()}
                    >
                      {applyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p className={`coupon-status-text ${appliedOffer ? "success" : "error"}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Itemized Bill Breakdown */}
              <div className="modern-bill-summary">
                <div className="bill-summary-row">
                  <span>Item Subtotal</span>
                  <span className="price-val">₹{totalAmount}</span>
                </div>
                <div className="bill-summary-row">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "free-text" : "price-val"}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="bill-summary-row">
                  <span>GST &amp; Restaurant Tax (5%)</span>
                  <span className="price-val">₹{tax}</span>
                </div>

                {discount > 0 && (
                  <div className="bill-summary-row discount-row">
                    <span>
                      Coupon Savings <strong className="code-hint">({appliedOffer.code})</strong>
                    </span>
                    <span className="discount-val">− ₹{discount}</span>
                  </div>
                )}

                <div className="bill-divider" />

                <div className="bill-total-row">
                  <div>
                    <span className="grand-total-label">Grand Total</span>
                    <span className="total-tax-note">Inclusive of all taxes</span>
                  </div>
                  <span className="grand-total-amount">₹{grandTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                className="modern-checkout-btn"
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? (
                  <span>⏳ Processing your order...</span>
                ) : (
                  <span>
                    {paymentMethod === "COD"
                      ? `Place Order (Cash on Delivery) • ₹${grandTotal}`
                      : `Pay ₹${grandTotal} & Place Order`}
                  </span>
                )}
              </button>

              <div className="checkout-trust-badges">
                <span>🔒 100% Secure Checkout</span>
                <span>⚡ Fast Doorstep Delivery</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
