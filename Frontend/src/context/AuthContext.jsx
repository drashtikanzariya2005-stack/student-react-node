import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

function readSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    };

    window.addEventListener("auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch {
      // Local logout should still complete even if the server is unavailable.
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // Tells CartContext to empty the cart, so the next person using this
    // browser doesn't inherit the previous customer's items.
    window.dispatchEvent(new CustomEvent("auth-logout"));
  };

  const updateUser = (partialUser) => {
    setUser((prev) => {
      const updated = { ...prev, ...partialUser };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
