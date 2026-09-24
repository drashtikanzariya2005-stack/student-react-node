import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useToast } from "../context/ToastContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await apiFetch("/users/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      setMessage(data.message + " Redirecting to login...");
      showToast("Account created! Please login.", "success");
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setMessage(error.message || "Something went wrong");
      showToast(error.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleRegister}>
        <h1>Create Account</h1>

        <label>
          Name
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        {message && <p className="status-msg">{message}</p>}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
