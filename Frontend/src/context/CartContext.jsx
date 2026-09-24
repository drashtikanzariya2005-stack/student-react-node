import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

// Reading localStorage can throw if the stored value was corrupted (or if
// the browser blocks storage). Without this guard a bad "cart" entry would
// crash the whole app on startup with a white screen.
function readSavedCart() {
  try {
    const savedCart = localStorage.getItem("cart");
    const parsed = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem("cart");
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readSavedCart);

  // Keep localStorage in sync whenever the cart changes.
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch {
      // Storage full or unavailable — the in-memory cart still works.
    }
  }, [cart]);

  // Logging out must not leave the cart behind for whoever uses this browser
  // next. AuthContext fires "auth-logout" on both manual and expired logout.
  useEffect(() => {
    const handleLogout = () => setCart([]);

    window.addEventListener("auth-logout", handleLogout);
    window.addEventListener("auth-expired", handleLogout);

    return () => {
      window.removeEventListener("auth-logout", handleLogout);
      window.removeEventListener("auth-expired", handleLogout);
    };
  }, []);

  const addToCart = (food) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item._id === food._id);

      if (existingItem) {
        return prev.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const increaseQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        clearCart,
        itemCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
