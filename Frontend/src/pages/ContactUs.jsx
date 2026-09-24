import { useState } from "react";
import { apiFetch } from "../api";
import { useToast } from "../context/ToastContext";

const emptyForm = { name: "", email: "", subject: "", message: "" };

function ContactUs() {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      showToast("Message sent! We'll get back to you soon.", "success");
      setForm(emptyForm);
    } catch (error) {
      showToast(error.message || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>📩 Contact Us</h1>
      <p>Questions, feedback, or an order issue? Send us a message below.</p>

      <div className="contact-layout">
        <form className="auth-form contact-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Subject
            <input name="subject" placeholder="General Inquiry" value={form.subject} onChange={handleChange} />
          </label>

          <label>
            Message
            <textarea name="message" rows={5} value={form.message} onChange={handleChange} required />
          </label>

          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="contact-info">
          <div className="why-card">
            <h3>📍 Address</h3>
            <p>123 Food Street, Flavor Town, India</p>
          </div>
          <div className="why-card">
            <h3>📞 Phone</h3>
            <p>+91 98765 43210</p>
          </div>
          <div className="why-card">
            <h3>✉️ Email</h3>
            <p>support@foodexpress.example</p>
          </div>
          <div className="why-card">
            <h3>🕒 Hours</h3>
            <p>Every day, 10 AM – 11 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
