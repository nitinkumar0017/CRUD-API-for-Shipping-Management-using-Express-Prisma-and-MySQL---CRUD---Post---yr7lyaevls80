// index.js
const express = require('express');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SHIPPING_SECRET_KEY;

// ================= Middleware =================
function verifySecret(req, res, next) {
  const key = req.header('SHIPPING_SECRET_KEY');

  if (!key) {
    return res.status(403).json({ error: "SHIPPING_SECRET_KEY is missing or invalid" });
  }

  if (key !== SECRET_KEY) {
    return res.status(403).json({ error: "Failed to authenticate SHIPPING_SECRET_KEY" });
  }

  next();
}

// Async wrapper for route handlers
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ================= Routes =================
const router = express.Router();
router.use(verifySecret);

// Create Shipping
router.post('/create', asyncHandler(async (req, res) => {
  const { userId, productId, count } = req.body;

  if (userId === undefined || productId === undefined || count === undefined) {
    return res.status(404).json({ error: "All fields required" });
  }

  const created = await prisma.shipping.create({
    data: { userId, productId, count },
  });

  res.status(201).json(created);
}));

// Cancel Shipping
router.put('/cancel', asyncHandler(async (req, res) => {
  const { shippingId } = req.body;

  if (shippingId === undefined) {
    return res.status(404).json({ error: "Missing shippingId" });
  }

  const existing = await prisma.shipping.findUnique({ where: { id: Number(shippingId) } });
  if (!existing) return res.status(404).json({ error: "Shipping record not found" });

  const updated = await prisma.shipping.update({
    where: { id: Number(shippingId) },
    data: { status: "cancelled" },
  });

  res.status(200).json(updated);
}));

// Get Shipping Records
router.get('/get', asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const where = {};

  if (userId) where.userId = Number(userId);

  const records = await prisma.shipping.findMany({ where });
  res.status(200).json(records);
}));

app.use('/api/shipping', router);

// ================= Error Handler =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ================= Start Server =================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

module.exports = app;
