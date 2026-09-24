const Contact = require("../models/Contact");

// SUBMIT CONTACT MESSAGE (public)
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email and message are required",
      });
    }

    const contact = await Contact.create({ name, email, subject, message });

    res.status(201).json({
      message: "Thanks for reaching out! We'll get back to you soon.",
      contact,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CONTACT MESSAGES (admin only)
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CONTACT MESSAGE STATUS (admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["New", "Read", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Status updated", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CONTACT MESSAGE (admin only)
const deleteContact = async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
};
