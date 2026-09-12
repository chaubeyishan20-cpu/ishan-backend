import express from "express";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { orderStatusSchema } from "../schemas/index.js";
import { notify } from "../utils/notify.js";

const router = express.Router();

// Orders where the user is the buyer
router.get("/buyer", auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.userId })
      .populate("seller", "name email location")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Orders where the user is the seller
router.get("/seller", auth, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.userId })
      .populate("buyer", "name email location")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status (seller advances: ordered → shipped → delivered)
router.patch("/:id/status", auth, validate(orderStatusSchema), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.seller.toString() !== req.userId && order.buyer.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized for this order" });
    }

    const next = req.body.status;
    const flow = ["ordered", "shipped", "delivered"];
    if (!flow.includes(next)) {
      return res.status(400).json({ message: "Invalid order status" });
    }
    const from = flow.indexOf(order.status);
    const to = flow.indexOf(next);
    if (to <= from || to - from > 1) {
      return res.status(400).json({ message: "Invalid order status transition" });
    }
    if (order.seller.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the seller can update the order status" });
    }

    order.status = next;
    await order.save();
    await notify(
      order.buyer,
      `Your order for ${order.cropName} (${order.quantity} ${order.unit}) is now ${next}.`,
      "/orders"
    );
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an order (buyer can remove delivered orders)
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.buyer.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (order.status === "ordered" || order.status === "shipped") {
      return res.status(400).json({ message: "You can only remove orders that are delivered" });
    }
    await order.deleteOne();
    res.json({ message: "Order removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
