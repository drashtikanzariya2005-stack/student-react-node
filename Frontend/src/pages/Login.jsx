import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(data.user, data.token);
      showToast(`Welcome back, ${data.user.name.split(" ")[0]}!`, "success");
      navigate("/");
    } catch (error) {
      setMessage(error.message || "Something went wrong");
      showToast(error.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      showToast("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      showToast("Password too short (min 6 characters)", "error");
      return;
    }

    setLoading(true);
    setMessage("");
    setResetSuccessMsg("");

    try {
      const data = await apiFetch("/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: forgotEmail,
          newPassword,
          confirmPassword,
          role: "user",
        }),
      });

      showToast(data.message || "Password reset successful! Please log in.", "success");
      setResetSuccessMsg("Password reset successfully! You can now log in.");
      setEmail(forgotEmail);
      setPassword("");
      setTimeout(() => {
        setIsForgotMode(false);
        setResetSuccessMsg("");
      }, 1500);
    } catch (error) {
      setMessage(error.message || "Failed to reset password");
      showToast(error.message || "Password reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {!isForgotMode ? (
        <form className={`auth-form ${message ? "shake" : ""}`} onSubmit={handleLogin}>
          <h1>Login to FoodExpress</h1>
          <p className="auth-subtitle">Welcome back! Please enter your details</p>

          <label>
            Email Address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <div className="label-with-action">
              <span>Password</span>
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => {
                  setIsForgotMode(true);
                  setForgotEmail(email);
                  setMessage("");
                }}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && <p className="status-msg error">{message}</p>}

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </form>
      ) : (
        <form
          className={`auth-form fade-in-up ${message ? "shake" : ""}`}
          onSubmit={handleResetPassword}
        >
          <h1>Reset Password</h1>
          <p className="auth-subtitle">
            Enter your registered email and choose a new password
          </p>

          {resetSuccessMsg && (
            <div className="status-msg success">{resetSuccessMsg}</div>
          )}

          <label>
            Registered Email Address
            <input
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </label>

          <label>
            New Password (min 6 characters)
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Resetting Password..." : "Reset Password & Login"}
          </button>

          {message && <p className="status-msg error">{message}</p>}

          <p className="auth-switch">
            <button
              type="button"
              className="back-text-btn"
              onClick={() => {
                setIsForgotMode(false);
                setMessage("");
              }}
            >
              ← Back to Login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

export default Login;
