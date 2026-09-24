const Offer = require("../models/Offer");

/**
 * Shared coupon rule check, used both by the cart's "Apply" preview
 * (validateOffer) and by createOrder in orderController.
 *
 * Returns { offer, discount } on success, or { error } with a message.
 */
const evaluateOffer = (offer, amount) => {
  if (!offer) {
    return { error: "Invalid coupon code" };
  }

  if (offer.isActive === false) {
    return { error: `Coupon ${offer.code} is currently disabled` };
  }

  const now = new Date();

  // 1. Check Start Date & Time
  if (offer.startDate && new Date(offer.startDate) > now) {
    const startFormatted = new Date(offer.startDate).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return {
      error: `Offer ${offer.code} starts on ${startFormatted}. It is not active yet.`,
    };
  }

  // 2. Check End Date & Time (Expiry)
  if (offer.endDate && new Date(offer.endDate) < now) {
    const endFormatted = new Date(offer.endDate).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return {
      error: `Offer ${offer.code} has expired on ${endFormatted} and is now closed.`,
    };
  }

  // 3. Check Minimum Order Amount
  const minOrder = Number(offer.minOrder || 0);
  if (amount < minOrder) {
    return {
      error: `Minimum order amount of ₹${minOrder} is required for coupon ${offer.code}. (Your cart is ₹${amount})`,
    };
  }

  // 4. Calculate Discount
  let rawDiscount = 0;
  if (offer.discountType === "percent") {
    rawDiscount = (amount * Number(offer.discountValue)) / 100;
    if (offer.maxDiscount && Number(offer.maxDiscount) > 0) {
      rawDiscount = Math.min(rawDiscount, Number(offer.maxDiscount));
    }
  } else {
    rawDiscount = Number(offer.discountValue);
  }

  // Never discount more than the subtotal itself
  const discount = Math.round(Math.min(rawDiscount, amount) * 100) / 100;

  return { offer, discount };
};

/**
 * Helper to enrich offer objects with live status flags
 */
const enrichOffer = (offerDoc) => {
  const offer = offerDoc.toObject ? offerDoc.toObject() : { ...offerDoc };
  const now = new Date();

  let status = "active";
  if (offer.isActive === false) {
    status = "disabled";
  } else if (offer.endDate && new Date(offer.endDate) < now) {
    status = "expired";
  } else if (offer.startDate && new Date(offer.startDate) > now) {
    status = "upcoming";
  }

  const isLive = status === "active";
  const timeLeftMs = offer.endDate ? Math.max(0, new Date(offer.endDate).getTime() - now.getTime()) : null;
  const timeToStartMs = offer.startDate ? Math.max(0, new Date(offer.startDate).getTime() - now.getTime()) : null;

  return {
    ...offer,
    status,
    isLive,
    timeLeftMs,
    timeToStartMs,
  };
};

// GET all offers
const getOffers = async (req, res) => {
  try {
    const { activeOnly, status } = req.query;
    const filter = {};

    // For customer view without explicit admin role, default to non-disabled offers
    if (req.user?.role !== "admin") {
      filter.isActive = true;
    }

    const rawOffers = await Offer.find(filter).sort({ createdAt: -1 });
    let enriched = rawOffers.map(enrichOffer);

    if (activeOnly === "true") {
      enriched = enriched.filter((o) => o.isLive);
    } else if (status) {
      enriched = enriched.filter((o) => o.status === status);
    }

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE offer (admin only)
const createOffer = async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.title || !data.code || data.discountValue === undefined) {
      return res.status(400).json({
        message: "Title, coupon code, and discount value are required",
      });
    }

    data.code = String(data.code).trim().toUpperCase();
    data.discountValue = Number(data.discountValue);
    data.minOrder = Number(data.minOrder || 0);

    if (data.maxDiscount === "" || data.maxDiscount === null || data.maxDiscount === undefined) {
      data.maxDiscount = null;
    } else {
      data.maxDiscount = Number(data.maxDiscount);
    }

    data.startDate = data.startDate ? new Date(data.startDate) : null;
    data.endDate = data.endDate ? new Date(data.endDate) : null;

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      return res.status(400).json({
        message: "End Date & Time must be after Start Date & Time",
      });
    }

    const offer = await Offer.create(data);
    res.status(201).json(enrichOffer(offer));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: `Coupon code "${req.body.code?.toUpperCase()}" already exists` });
    }
    res.status(400).json({ message: error.message });
  }
};

// UPDATE offer (admin only)
const updateOffer = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.code !== undefined) {
      data.code = String(data.code).trim().toUpperCase();
      if (!data.code) {
        return res.status(400).json({ message: "Coupon code cannot be empty" });
      }
    }

    if (data.discountValue !== undefined) {
      data.discountValue = Number(data.discountValue);
    }

    if (data.minOrder !== undefined) {
      data.minOrder = Number(data.minOrder || 0);
    }

    if (data.maxDiscount === "" || data.maxDiscount === null) {
      data.maxDiscount = null;
    } else if (data.maxDiscount !== undefined) {
      data.maxDiscount = Number(data.maxDiscount);
    }

    if (data.startDate !== undefined) {
      data.startDate = data.startDate ? new Date(data.startDate) : null;
    }

    if (data.endDate !== undefined) {
      data.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      return res.status(400).json({
        message: "End Date & Time must be after Start Date & Time",
      });
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json(enrichOffer(offer));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: `Coupon code "${req.body.code?.toUpperCase()}" already exists` });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE offer (admin only)
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VALIDATE coupon code
const validateOffer = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const amount = Number(req.body.amount || 0);

    if (!code) {
      return res.status(400).json({ message: "Please enter a coupon code" });
    }

    const offer = await Offer.findOne({ code, isActive: true });

    if (!offer) {
      return res.status(404).json({ message: `Coupon code "${code}" is invalid or inactive` });
    }

    const result = evaluateOffer(offer, amount);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.status(200).json({
      offer: enrichOffer(result.offer),
      discount: result.discount,
      message: `Coupon ${result.offer.code} applied successfully!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  evaluateOffer,
  enrichOffer,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  validateOffer,
};
