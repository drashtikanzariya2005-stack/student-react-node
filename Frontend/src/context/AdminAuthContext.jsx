import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../api";

// Completely separate from AuthContext (the customer session). Uses its
// own localStorage keys ("adminToken" / "adminUser") and its own
// "admin-auth-expired" event, so logging in on one side can never
// overwrite or leak into the other side's session.
const AdminAuthContext = createContext(null);

function readSavedAdmin() {
  try {
    const savedUser = localStorage.getItem("adminUser");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(readSavedAdmin);

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setUser(null);
    };

    window.addEventListener("admin-auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("admin-auth-expired", handleAuthExpired);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("adminToken");

    try {
      if (token) {
        await fetch(`${API_URL}/users/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Local logout should still complete even if the server is unavailable.
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }

  return context;
}
