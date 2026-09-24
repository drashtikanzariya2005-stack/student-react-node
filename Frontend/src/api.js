// Central place for the backend base URL and a small fetch wrapper.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Customer site and admin panel are two completely separate sessions.
// They use different localStorage keys and different "expired" events so
// logging into one can NEVER overwrite or piggy-back on the other's token.
const STORAGE_KEYS = {
  customer: { token: "token", user: "user", expiredEvent: "auth-expired" },
  admin: { token: "adminToken", user: "adminUser", expiredEvent: "admin-auth-expired" },
};

const notifyAuthExpired = (eventName) => {
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {
    // Ignore environments without CustomEvent.
  }
};

/**
 * Shared implementation behind apiFetch / adminApiFetch. `namespace`
 * decides which pair of localStorage keys (and which "expired" event)
 * this call reads/clears, so a customer request never touches the
 * admin's token and vice versa.
 */
async function request(namespace, path, options = {}) {
  const keys = STORAGE_KEYS[namespace];
  const token = localStorage.getItem(keys.token);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response had no JSON body.
  }

  // A stale/expired JWT must not leave an old session in the browser —
  // but only clear the namespace that actually made this request.
  if (response.status === 401) {
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
    notifyAuthExpired(keys.expiredEvent);
  }

  if (!response.ok) {
    const error = new Error(
      (data && data.message) || "Something went wrong"
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Use on customer-facing pages (Login, Register, Cart, MyOrders, Profile...).
 * Reads/writes the "token" / "user" localStorage keys only.
 */
export function apiFetch(path, options = {}) {
  return request("customer", path, options);
}

/**
 * Use on admin pages only (AdminLogin, AdminLayout, Manage*).
 * Reads/writes the "adminToken" / "adminUser" localStorage keys only,
 * so it can never be mixed up with a customer's session.
 */
export function adminApiFetch(path, options = {}) {
  return request("admin", path, options);
}
