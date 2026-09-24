import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useToast } from "../../context/ToastContext";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const navigate = useNavigate();
  const { user, login } = useAdminAuth();
  const { showToast } = useToast();

  if (user && user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await adminApiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (data.user.role !== "admin") {
        setMessage("Access Denied: This account does not possess administrator credentials.");
        showToast("Access Denied — Admin Role Required", "error");
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      showToast(`Welcome back, ${data.user.name.split(" ")[0]}!`, "success");
      navigate("/admin");
    } catch (error) {
      setMessage(error.message || "Invalid email or password");
      showToast(error.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdminPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      showToast("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      showToast("Password too short (min 6 chars)", "error");
      return;
    }

    setLoading(true);
    setMessage("");
    setResetSuccessMsg("");

    try {
      const data = await adminApiFetch("/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword,
          confirmPassword,
          role: "admin",
        }),
      });

      showToast(data.message || "Admin password reset successfully!", "success");
      setResetSuccessMsg("Password reset successfully! You can now sign in.");
      setEmail(forgotEmail);
      setPassword("");
      setTimeout(() => {
        setIsForgotMode(false);
        setResetSuccessMsg("");
      }, 1400);
    } catch (error) {
      setMessage(error.message || "Failed to reset admin password");
      showToast(error.message || "Password reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("admin@fooddelivery.com");
    setPassword("admin123");
    setMessage("");
  };

  return (
    <div className="admin-auth-split-page">
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="auth-ambient-glow glow-top-left" />
      <div className="auth-ambient-glow glow-bottom-right" />

      <div className="admin-auth-card-wrapper">
        {/* LEFT COLUMN: BRANDING & SYSTEM SHOWCASE */}
        <div className="admin-auth-showcase-panel">
          <div className="showcase-top-badge">
            <span className="live-status-pulse-dot" />
            <span>SECURE RESTRICTED ACCESS</span>
          </div>

          <div className="showcase-brand-hero">
            <div className="showcase-logo-icon">⚡</div>
            <div className="showcase-titles">
              <h2>FoodExpress</h2>
              <span className="showcase-edition-pill">ADMIN CONSOLE</span>
            </div>
          </div>

          <p className="showcase-lead-text">
            Enterprise store management platform for real-time live orders, dish catalog taxonomy, partner kitchens, and customer fulfillment.
          </p>

          <div className="showcase-feature-highlights">
            <div className="showcase-feature-chip">
              <span className="feature-chip-icon">📦</span>
              <div className="feature-chip-content">
                <strong>Live Order Manager</strong>
                <span>Real-time dispatch &amp; status transitions</span>
              </div>
            </div>

            <div className="showcase-feature-chip">
              <span className="feature-chip-icon">🗂️</span>
              <div className="feature-chip-content">
                <strong>Dynamic Menu Taxonomy</strong>
                <span>Hierarchical main &amp; subcategory system</span>
              </div>
            </div>

            <div className="showcase-feature-chip">
              <span className="feature-chip-icon">🛡️</span>
              <div className="feature-chip-content">
                <strong>Role-Based Access</strong>
                <span>Secured with JWT authentication &amp; bcrypt</span>
              </div>
            </div>
          </div>

          <div className="showcase-footer-meta">
            <span>FoodExpress Admin Hub • MCA Sem 3 Project</span>
            <span className="version-tag">v2.5.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION FORM TERMINAL */}
        <div className="admin-auth-terminal-panel">
          {!isForgotMode ? (
            <div className="auth-form-container fade-in-up">
              <div className="terminal-header-block">
                <div className="terminal-icon-badge">🔐</div>
                <h1>Administrator Sign In</h1>
                <p className="terminal-sub-desc">
                  Enter your verified staff credentials to manage the store
                </p>
              </div>

              {message && (
                <div className="admin-alert-box alert-box-error">
                  <span className="alert-icon">⚠️</span>
                  <p>{message}</p>
                </div>
              )}

              <form className="admin-terminal-form" onSubmit={handleLogin}>
                <div className="terminal-input-group">
                  <label htmlFor="admin-email">Admin Email Address</label>
                  <div className="terminal-input-wrapper">
                    <span className="input-prefix-icon">✉️</span>
                    <input
                      id="admin-email"
                      type="email"
                      placeholder="admin@fooddelivery.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="terminal-input-group">
                  <div className="terminal-label-row">
                    <label htmlFor="admin-password">Staff Password</label>
                    <button
                      type="button"
                      className="terminal-forgot-trigger"
                      onClick={() => {
                        setIsForgotMode(true);
                        setForgotEmail(email);
                        setMessage("");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="terminal-input-wrapper">
                    <span className="input-prefix-icon">🔑</span>
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter administrator password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-peek-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="terminal-primary-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="submit-loading-state">
                      <span className="btn-spinner" /> Authenticating Session...
                    </span>
                  ) : (
                    <span>⚡ Sign In to Control Panel</span>
                  )}
                </button>

                {/* ONE-CLICK DEMO CREDENTIALS SHORTCUT */}
                <div className="demo-credentials-card">
                  <div className="demo-card-info">
                    <span className="demo-icon">💡</span>
                    <div>
                      <strong>Demo Admin Credentials</strong>
                      <p>admin@fooddelivery.com / admin123</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="demo-autofill-btn"
                    onClick={handleQuickFill}
                  >
                    Auto-Fill
                  </button>
                </div>

                <div className="terminal-footer-links">
                  <Link to="/" className="storefront-link-pill">
                    ← Return to Customer Storefront
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <div className="auth-form-container fade-in-up">
              <div className="terminal-header-block">
                <div className="terminal-icon-badge">🔄</div>
                <h1>Reset Admin Password</h1>
                <p className="terminal-sub-desc">
                  Verify your admin email and configure a new security password
                </p>
              </div>

              {resetSuccessMsg && (
                <div className="admin-alert-box alert-box-success">
                  <span className="alert-icon">✅</span>
                  <p>{resetSuccessMsg}</p>
                </div>
              )}

              {message && (
                <div className="admin-alert-box alert-box-error">
                  <span className="alert-icon">⚠️</span>
                  <p>{message}</p>
                </div>
              )}

              <form className="admin-terminal-form" onSubmit={handleResetAdminPassword}>
                <div className="terminal-input-group">
                  <label htmlFor="admin-forgot-email">Registered Admin Email</label>
                  <div className="terminal-input-wrapper">
                    <span className="input-prefix-icon">✉️</span>
                    <input
                      id="admin-forgot-email"
                      type="email"
                      placeholder="admin@fooddelivery.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="terminal-input-group">
                  <label htmlFor="admin-new-password">New Password (min 6 characters)</label>
                  <div className="terminal-input-wrapper">
                    <span className="input-prefix-icon">🔑</span>
                    <input
                      id="admin-new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Choose new strong password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-peek-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="terminal-input-group">
                  <label htmlFor="admin-confirm-password">Confirm New Password</label>
                  <div className="terminal-input-wrapper">
                    <span className="input-prefix-icon">🔒</span>
                    <input
                      id="admin-confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="terminal-primary-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="submit-loading-state">
                      <span className="btn-spinner" /> Updating Credentials...
                    </span>
                  ) : (
                    <span>🔄 Update &amp; Save Admin Password</span>
                  )}
                </button>

                <div className="terminal-footer-links">
                  <button
                    type="button"
                    className="terminal-back-btn"
                    onClick={() => {
                      setIsForgotMode(false);
                      setMessage("");
                    }}
                  >
                    ← Back to Administrator Sign In
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
