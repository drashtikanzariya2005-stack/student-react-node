import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    setError("");
    apiFetch("/wishlist")
      .then((data) => setItems(data.foods || []))
      .catch((err) => setError(err.message || "Could not load your wishlist"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (food) => {
    try {
      await apiFetch(`/wishlist/${food._id}`, { method: "POST" });
      setItems((prev) => prev.filter((f) => f._id !== food._id));
      showToast(`${food.name} removed from wishlist`, "success");
    } catch (err) {
      showToast(err.message || "Could not update wishlist", "error");
    }
  };

  const handleAdd = (food) => {
    addToCart(food);
    showToast(`${food.name} added to cart`, "success");
  };

  return (
    <div className="menu-page">
      <h1>❤️ My Wishlist</h1>

      {loading && <p className="status-msg">Loading wishlist...</p>}

      {!loading && error && <p className="status-msg error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="status-msg">
          Your wishlist is empty. Go to the{" "}
          <Link to="/menu">menu</Link> and tap the ❤️ on any dish to save it here.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="food-container">
          {items.map((food) => (
            <div className="food-card" key={food._id}>
              <div className="food-img-wrap">
                <img
                  src={food.image || PLACEHOLDER_IMAGE}
                  alt={food.name}
                  className="food-img"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                />
                <button
                  type="button"
                  className="wishlist-heart wishlist-heart-active"
                  title="Remove from wishlist"
                  onClick={() => remove(food)}
                >
                  ❤️
                </button>
              </div>
              <div className="food-card-body">
                <h3>{food.name}</h3>
                <p className="food-desc">{food.description}</p>
                <div className="food-card-footer">
                  <span className="food-price">₹{food.price}</span>
                  <div className="food-card-actions">
                    <button className="btn-primary btn-small" onClick={() => handleAdd(food)}>
                      Add to Cart
                    </button>
                    <button className="btn-outline btn-small" onClick={() => remove(food)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
