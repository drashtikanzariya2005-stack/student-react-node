import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

const heroImg =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80";

const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70";

function Home() {
  const { user } = useAuth();
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/categories/main?activeOnly=true"),
      apiFetch("/categories?activeOnly=true"),
    ])
      .then(([mainsData, subsData]) => {
        setMainCategories(mainsData || []);
        setSubCategories(subsData || []);
      })
      .catch(() => {
        setMainCategories([]);
        setSubCategories([]);
      });
  }, []);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-text">
          <h1>Delicious food, delivered fast 🍔</h1>
          <p>
            Order from our curated menu of fresh pizzas, burgers, curries, beverages and more —
            hot and ready at your doorstep.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn-primary">
              Explore Menu
            </Link>
            {!user && (
              <Link to="/login" className="btn-outline">
                Login
              </Link>
            )}
          </div>
        </div>
        <img
          src={heroImg}
          alt="Delicious food spread"
          className="hero-img"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </section>

      {!user && (
        <section className="guest-cta">
          <div>
            <h3>New here?</h3>
            <p>Login or create an account to order, track deliveries, and save your favourites.</p>
          </div>
          <div className="guest-cta-actions">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/register" className="btn-outline">Register</Link>
          </div>
        </section>
      )}

      {/* DYNAMIC MAIN CATEGORIES SHOWCASE */}
      {mainCategories.length > 0 && (
        <section className="categories">
          <div className="section-title-wrap">
            <h2>Browse by Main Category</h2>
            <p className="section-subtitle">Discover food tailored to your taste and dietary preferences</p>
          </div>

          <div className="category-grid">
            {mainCategories.map((cat) => {
              const bgImg = cat.image || FALLBACK_CATEGORY_IMAGE;
              return (
                <Link
                  key={cat._id}
                  to={`/menu?diet=${encodeURIComponent(cat.name)}`}
                  className="category-card"
                  style={{ backgroundImage: `url(${bgImg})` }}
                >
                  <span className="category-overlay" />
                  <span className="category-emoji">{cat.icon || "🍽️"}</span>
                  <span className="category-name">{cat.name}</span>
                  {cat.subCategoryCount > 0 && (
                    <span className="category-count-sub">
                      {cat.subCategoryCount} subcategor{cat.subCategoryCount === 1 ? "y" : "ies"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Subcategory Pills */}
          {subCategories.length > 0 && (
            <div className="home-sub-pills">
              <span className="home-sub-title">Popular Subcategories:</span>
              <div className="home-sub-list">
                {subCategories.slice(0, 10).map((sub) => (
                  <Link
                    key={sub._id}
                    to={`/menu?diet=${encodeURIComponent(sub.mainCategory)}&category=${encodeURIComponent(sub.name)}`}
                    className="home-sub-chip"
                  >
                    🏷️ {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="why-us">
        <h2>Why FoodExpress?</h2>
        <div className="why-grid">
          <div className="why-card">
            <h3>⚡ Fast Delivery</h3>
            <p>Your food reaches you hot and fresh, in record time.</p>
          </div>
          <div className="why-card">
            <h3>🍽️ Wide Variety</h3>
            <p>From local favorites to global cuisines, all in one place.</p>
          </div>
          <div className="why-card">
            <h3>💳 Easy Ordering</h3>
            <p>Simple cart and checkout — track your orders anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
