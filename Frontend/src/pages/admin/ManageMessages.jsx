import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiFetch } from "../../api";
import { useToast } from "../../context/ToastContext";

const STATUS_OPTIONS = ["New", "Read", "Resolved"];

function ManageMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await adminApiFetch("/contact");
      setMessages(data || []);
    } catch (error) {
      showToast(error.message || "Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await adminApiFetch(`/contact/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
      showToast(`Inquiry marked as ${status}`, "success");
    } catch (error) {
      showToast(error.message || "Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer message?")) return;
    try {
      await adminApiFetch(`/contact/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m._id !== id));
      showToast("Message deleted", "success");
    } catch (error) {
      showToast(error.message || "Failed to delete message", "error");
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesStatus =
        statusFilter === "All" ||
        (msg.status || "").toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        msg.name?.toLowerCase().includes(q) ||
        msg.email?.toLowerCase().includes(q) ||
        msg.subject?.toLowerCase().includes(q) ||
        msg.message?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [messages, statusFilter, searchQuery]);

  return (
    <div className="admin-page-container">
      {/* HEADER */}
      <div className="admin-view-header">
        <div className="view-title-block">
          <Link to="/admin" className="admin-back-breadcrumbs">
            ← Dashboard
          </Link>
          <div className="view-badge">CUSTOMER FEEDBACK</div>
          <h1>📩 Contact &amp; Inquiry Messages</h1>
          <p className="view-subtitle">
            Read messages submitted from the public contact page, track inquiry resolution, and manage feedback.
          </p>
        </div>

        <div className="view-stat-pill">
          <span className="pill-number">{messages.length}</span>
          <span className="pill-label">Total Messages</span>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="admin-surface-card filter-toolbar-card">
        <div className="status-filter-pills-row">
          {["All", "New", "Read", "Resolved"].map((st) => {
            const count =
              st === "All"
                ? messages.length
                : messages.filter((m) => m.status === st).length;

            return (
              <button
                key={st}
                type="button"
                className={`status-tab-pill ${statusFilter === st ? "active-pill" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                <span>{st}</span>
                <span className="tab-count-badge">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="filter-search-block">
          <input
            type="search"
            placeholder="Search by customer name, email, subject, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="inbox-messages-list">
        {loading ? (
          <div className="admin-loading-box">
            <div className="loading-spinner" />
            <p>Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="admin-surface-card admin-empty-box">
            <span className="empty-state-icon">✉️</span>
            <h3>No Messages Found</h3>
            <p>No customer contact messages match your current filter.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const statusClass =
              msg.status === "New"
                ? "badge-status-pending"
                : msg.status === "Resolved"
                ? "badge-status-delivered"
                : "badge-status-preparing";

            return (
              <div className="admin-surface-card modern-message-card" key={msg._id}>
                <div className="message-card-top-bar">
                  <div className="sender-profile-block">
                    <div className="sender-avatar-bubble">
                      {msg.name ? msg.name.charAt(0).toUpperCase() : "M"}
                    </div>
                    <div>
                      <strong className="sender-name-text">{msg.name || "Customer"}</strong>
                      <p className="sender-email-text">{msg.email}</p>
                    </div>
                  </div>

                  <div className="message-meta-right">
                    <span className="message-timestamp">
                      🕒 {new Date(msg.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>

                    <select
                      className={`admin-status-select ${statusClass}`}
                      value={msg.status || "New"}
                      onChange={(e) => handleStatusChange(msg._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="action-btn-delete"
                      onClick={() => handleDelete(msg._id)}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="message-subject-line">
                  <strong>Subject:</strong> {msg.subject || "General Inquiry"}
                </div>

                <div className="message-body-box">
                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManageMessages;
