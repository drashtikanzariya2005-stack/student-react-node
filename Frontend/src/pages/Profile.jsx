import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Profile() {
  const { updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwMessage, setPwMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiFetch("/users/profile");
        setProfile(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch (error) {
        showToast(error.message || "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile((prev) => ({ ...prev, ...data.user }));
      updateUser(data.user);
      showToast("Profile updated", "success");
    } catch (error) {
      showToast(error.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage("New password and confirm password do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch("/users/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      showToast("Password changed successfully", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPwMessage(error.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <p className="status-msg">Loading profile...</p>;
  }

  return (
    <div className="profile-page">
      <h1>👤 My Profile</h1>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Login Details</h2>
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span>{profile?.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span>{profile?.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Role</span>
            <span className={`badge ${profile?.role === "admin" ? "badge-out" : "badge-preparing"}`}>
              {profile?.role}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Joined</span>
            <span>{profile?.createdAt && new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <form className="profile-card" onSubmit={handleProfileSubmit}>
          <h2>Edit Profile</h2>

          <label>
            Full Name
            <input name="name" value={form.name} onChange={handleProfileChange} required />
          </label>

          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleProfileChange} placeholder="e.g. 9876543210" />
          </label>

          <label>
            Delivery Address
            <textarea name="address" value={form.address} onChange={handleProfileChange} rows={3} placeholder="Your default delivery address" />
          </label>

          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <form className={`profile-card ${pwMessage ? "shake" : ""}`} onSubmit={handlePasswordSubmit}>
          <h2>Change Password</h2>

          <label>
            Current Password
            <input
              type="password"
              name="currentPassword"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              name="newPassword"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              minLength={6}
              required
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              minLength={6}
              required
            />
          </label>

          {pwMessage && <p className="status-msg error">{pwMessage}</p>}

          <button type="submit" className="btn-outline" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
