// src/index.js
const express = require('express');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const SECRET = process.env.SHIPPING_SECRET_KEY;

// --- verifySecret middleware ---
function verifySecret(req, res, next) {
  const key = req.header('SHIPPING_SECRET_KEY');

  if (!key) {
    return res.status(403).json({ error: "SHIPPING_SECRET_KEY is missing or invalid" });
  }

  if (key !== SECRET) {
    return res.status(403).json({ error: "Failed to authenticate SHIPPING_SECRET_KEY" });
  }

  next();
}

// --- Shipping routes ---
const router = express.Router();
router.use(verifySecret);

// Create a shipping record
router.post('/create', async (req, res) => {
  const { userId, productId, count } = req.body;
  if (userId === undefined || productId === undefined || count === undefined) {
    return res.status(404).json({ error: "All fields required" });
  }

  const created = await prisma.shipping.create({
    data: { userId, productId, count },
  });

  res.status(201).json(created);
});

// Cancel a shipping record
router.put('/cancel', async (req, res) => {
  const { shippingId } = req.body;
  if (shippingId === undefined) return res.status(404).json({ error: "Missing shippingId" });

  const existing = await prisma.shipping.findUnique({ where: { id: shippingId } });
  if (!existing) return res.status(404).json({ error: "Shipping record not found" });

  const updated = await prisma.shipping.update({
    where: { id: shippingId },
    data: { status: "cancelled" },
  });

  res.status(200).json(updated);
});

// Get shipping records
router.get('/get', async (req, res) => {
  const { userId } = req.query;
  const where = {};
  if (userId) where.userId = Number(userId);

  const records = await prisma.shipping.findMany({ where });
  res.status(200).json(records);
});

app.use('/api/shipping', router);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
