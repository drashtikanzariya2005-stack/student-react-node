import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(itemCount);

  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 400);
      prevCount.current = itemCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        🍔 FoodExpress
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/restaurants">🏪 Restaurants</Link>
        <Link to="/offers">Offers</Link>
        {user && <Link to="/wishlist">❤️ Wishlist</Link>}
        <Link to="/cart" className="cart-link">
          Cart
          {itemCount > 0 && (
            <span className={`cart-badge ${bounce ? "cart-badge-bounce" : ""}`}>
              {itemCount}
            </span>
          )}
        </Link>
        <Link to="/contact">Contact</Link>

        {user ? (
          <>
            <Link to="/my-orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
            <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
            <button className="link-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-outline">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
