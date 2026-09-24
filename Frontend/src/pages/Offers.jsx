import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useToast } from "../context/ToastContext";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("live"); // 'live' | 'all' | 'upcoming'
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    apiFetch("/offers")
      .then((data) => setOffers(data || []))
      .catch((err) => setError(err.message || "Could not load offers"))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Coupon code ${code} copied!`, "success");
    } catch {
      showToast(`Use code: ${code}`, "success");
    }
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTimeRemainingText = (offer) => {
    const now = Date.now();
    if (offer.endDate) {
      const end = new Date(offer.endDate).getTime();
      if (end < now) return "Expired & Closed";

      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `Ends in ${days}d ${hours}h`;
      if (hours > 0) return `Ends in ${hours}h ${mins}m`;
      return `Ends in ${mins}m`;
    }

    if (offer.startDate) {
      const start = new Date(offer.startDate).getTime();
      if (start > now) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `Starts in ${days}d ${hours}h` : `Starts in ${hours}h`;
      }
    }

    return "Active Deal";
  };

  const filteredOffers = useMemo(() => {
    if (filterTab === "live") return offers.filter((o) => o.isLive || o.status === "active");
    if (filterTab === "upcoming") return offers.filter((o) => o.status === "upcoming");
    return offers;
  }, [offers, filterTab]);

  return (
    <div className="menu-page offers-page">
      <div className="menu-header-section">
        <h1>🎁 Special Offers &amp; Promo Deals</h1>
        <p className="menu-subtitle">
          Save on your favorite dishes with time-limited discounts and promo coupons!
        </p>
      </div>

      {/* FILTER TABS */}
      <div className="diet-filter" style={{ marginBottom: "20px" }}>
        <button
          className={`pill pill-diet ${filterTab === "live" ? "pill-active" : ""}`}
          onClick={() => setFilterTab("live")}
        >
          🔥 Live Offers ({offers.filter((o) => o.isLive || o.status === "active").length})
        </button>
        <button
          className={`pill pill-diet ${filterTab === "upcoming" ? "pill-active" : ""}`}
          onClick={() => setFilterTab("upcoming")}
        >
          ⏳ Upcoming ({offers.filter((o) => o.status === "upcoming").length})
        </button>
        <button
          className={`pill pill-diet ${filterTab === "all" ? "pill-active" : ""}`}
          onClick={() => setFilterTab("all")}
        >
          🌟 All Offers ({offers.length})
        </button>
      </div>

      {loading && <p className="status-msg">Loading special offers...</p>}

      {!loading && error && <p className="status-msg error">{error}</p>}

      {!loading && !error && filteredOffers.length === 0 && (
        <div className="empty-placeholder-card">
          <span className="empty-icon">🎁</span>
          <h3>No offers available in this tab</h3>
          <p>Check back soon for exciting new promo discounts!</p>
        </div>
      )}

      <div className="food-container">
        {filteredOffers.map((offer) => {
          const isExpired = offer.status === "expired";
          const isUpcoming = offer.status === "upcoming";
          const isLive = offer.isLive || offer.status === "active";
          const startFormatted = formatDateTime(offer.startDate);
          const endFormatted = formatDateTime(offer.endDate);

          return (
            <div
              className={`food-card offer-card ${
                isExpired ? "offer-card-expired" : isUpcoming ? "offer-card-upcoming" : "offer-card-live"
              }`}
              key={offer._id}
            >
              <div className="food-card-body">
                <div className="offer-badge-row">
                  {isLive && (
                    <span className="badge badge-delivered">
                      🟢 Live Deal · {getTimeRemainingText(offer)}
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="badge badge-preparing">
                      ⏳ Starts Soon · {getTimeRemainingText(offer)}
                    </span>
                  )}
                  {isExpired && (
                    <span className="badge badge-cancelled">
                      🔴 Expired / Closed
                    </span>
                  )}
                </div>

                <h2 className="offer-title">{offer.title}</h2>
                <p className="offer-desc">{offer.description || "Apply this coupon at checkout to receive instant discount."}</p>

                <div className="offer-discount-banner">
                  <span className="discount-amount">
                    {offer.discountType === "percent"
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue} FLAT OFF`}
                  </span>
                  {offer.maxDiscount && (
                    <span className="discount-cap">Up to ₹{offer.maxDiscount}</span>
                  )}
                </div>

                {offer.minOrder > 0 && (
                  <p className="offer-min-order">
                    🛒 Min order required: <strong>₹{offer.minOrder}</strong>
                  </p>
                )}

                {/* Date Time Schedule Info */}
                <div className="offer-schedule-box">
                  {startFormatted && (
                    <div>
                      <span>Starts:</span> <strong>{startFormatted}</strong>
                    </div>
                  )}
                  {endFormatted && (
                    <div>
                      <span>Valid Till:</span> <strong>{endFormatted}</strong>
                    </div>
                  )}
                  {!startFormatted && !endFormatted && (
                    <div>
                      <span>Validity:</span> <strong>Always Active</strong>
                    </div>
                  )}
                </div>

                <div className="offer-code-row">
                  <span className="offer-code">{offer.code}</span>
                  {isLive ? (
                    <div className="offer-card-actions-group">
                      <button
                        className="btn-outline btn-small"
                        onClick={() => copyCode(offer.code)}
                      >
                        📋 Copy Code
                      </button>
                      <Link to="/cart" className="btn-primary btn-small">
                        Apply in Cart →
                      </Link>
                    </div>
                  ) : isUpcoming ? (
                    <button
                      className="btn-outline btn-small"
                      disabled
                    >
                      ⏳ Starts Soon
                    </button>
                  ) : (
                    <button
                      className="btn-outline btn-small"
                      disabled
                    >
                      ❌ Offer Closed
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
