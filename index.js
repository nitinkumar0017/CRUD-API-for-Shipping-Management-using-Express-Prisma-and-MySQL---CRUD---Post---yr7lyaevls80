const express = require("express");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// 🔑 Middleware: verify SHIPPING_SECRET_KEY
app.use((req, res, next) => {
  const key = req.headers["shipping_secret_key"];

  if (!key) {
    return res
      .status(403)
      .json({ error: "SHIPPING_SECRET_KEY is missing or invalid" });
  }

  if (key !== process.env.SHIPPING_SECRET_KEY) {
    return res
      .status(403)
      .json({ error: "Failed to authenticate SHIPPING_SECRET_KEY" });
  }

  next();
});

// ✅ Create a Shipping Record
app.post("/api/shipping/create", async (req, res) => {
  const { userId, productId, count } = req.body;

  if (!userId || !productId || !count) {
    return res.status(404).json({ error: "All fields required" });
  }

  try {
    const shipping = await prisma.shipping.create({
      data: { userId, productId, count },
    });
    return res.status(201).json(shipping);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// ✅ Cancel a Shipping Record
app.put("/api/shipping/cancel", async (req, res) => {
  const { shippingId } = req.body;

  if (!shippingId) {
    return res.status(404).json({ error: "Missing shippingId" });
  }

  try {
    const shipping = await prisma.shipping.update({
      where: { id: shippingId },
      data: { status: "cancelled" },
    });
    return res.status(200).json(shipping);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});


app.get("/api/shipping/get", async (req, res) => {
  const { userId } = req.query;

  try {
    const shippings = await prisma.shipping.findMany({
      where: userId ? { userId: Number(userId) } : {},
    });
    return res.status(200).json(shippings);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
