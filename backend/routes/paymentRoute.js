import express from "express";
import {
  createPayment,
  getMyPayments,
  getPaymentById,
  getCustomerPayments,
  getAllPayments,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import {
  getPaymentSettings,
  updateRazorpaySetting,
} from "../controllers/paymentSettingController.js";
import authMiddleware from "../middleware/auth.js";
import {
  adminOrSuperAdmin,
  customerOnly,
} from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const paymentRouter = express.Router();

// Customer payment endpoints
paymentRouter.get("/my", authMiddleware, customerOnly, getMyPayments);
paymentRouter.post("/claim", authMiddleware, customerOnly, upload.single("paymentProof"), createPayment);
paymentRouter.post("/razorpay/create-order", authMiddleware, customerOnly, createRazorpayOrder);
paymentRouter.post("/razorpay/verify", authMiddleware, customerOnly, verifyRazorpayPayment);

// Payment settings
paymentRouter.get("/settings", authMiddleware, getPaymentSettings);
paymentRouter.patch("/settings/razorpay", authMiddleware, adminOrSuperAdmin, updateRazorpaySetting);

// Admin payment approval and history
paymentRouter.get("/pending", authMiddleware, adminOrSuperAdmin, getPendingPayments);
paymentRouter.get("/customer/:customerId", authMiddleware, adminOrSuperAdmin, getCustomerPayments);
paymentRouter.patch("/:id/approve", authMiddleware, adminOrSuperAdmin, approvePayment);
paymentRouter.patch("/:id/reject", authMiddleware, adminOrSuperAdmin, rejectPayment);
paymentRouter.post("/", authMiddleware, adminOrSuperAdmin, upload.single("paymentProof"), createPayment);
paymentRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllPayments);
paymentRouter.get("/:id", authMiddleware, adminOrSuperAdmin, getPaymentById);

export default paymentRouter;