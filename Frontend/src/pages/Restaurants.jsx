import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/restaurants")
      .then((data) => setRestaurants((data || []).filter((r) => r.isActive !== false)))
      .catch((err) => setError(err.message || "Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  const openRestaurant = (restaurant) => {
    // Menu stays browsable as normal — this just pre-filters it, it's not a
    // gate you have to go through before seeing any menu.
    navigate(`/menu?restaurant=${encodeURIComponent(restaurant.name)}`);
  };

  return (
    <div className="menu-page">
      <h1>🏪 Restaurants</h1>
      <p className="status-msg" style={{ background: "transparent", padding: 0 }}>
        Browse restaurants on FoodExpress, or tap one to see its dishes on the menu.
      </p>

      {loading && <p className="status-msg">Loading restaurants...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && restaurants.length === 0 && (
        <p className="status-msg">No restaurants added yet. Check back soon!</p>
      )}

      <div className="restaurant-grid">
        {restaurants.map((r) => (
          <button
            key={r._id}
            className="restaurant-card"
            onClick={() => openRestaurant(r)}
          >
            <img
              src={r.image || PLACEHOLDER_IMAGE}
              alt={r.name}
              className="restaurant-card-img"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
            <div className="restaurant-card-body">
              <h3>{r.name}</h3>
              {r.rating > 0 && <span className="restaurant-rating">⭐ {r.rating}</span>}
              {r.cuisine && <p className="food-desc">{r.cuisine}</p>}
              {r.address && <p className="food-category">📍 {r.address}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
