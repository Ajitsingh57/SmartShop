import crypto from "node:crypto";
import Payment from "../models/paymentModel.js";
import Credit from "../models/creditModel.js";
import Customer from "../models/customerModel.js";
import PaymentSetting from "../models/paymentSettingModel.js";
import razorpay from "../config/razorpay.js";
import cloudinary from "../config/cloudinary.js";
import { runTransaction, sendValidationError } from "../utils/helpers.js";
import { syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";
import { logAdminActivity } from "../utils/activityLogger.js";

const PAYMENT_METHODS = ["cash", "upi"];

const isValidAmount = (amount) => {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0;
};

const getAmount = (amount) => Number(amount);

const isAdmin = (role) => role === "admin" || role === "superadmin";

const isCustomer = (role) => role === "customer";

const isRazorpayEnabled = async () => {
  const setting = await PaymentSetting.findOne();
  return setting?.razorpayEnabled === true;
};

// Upload payment receipt image to Cloudinary
const uploadPaymentProof = async (file) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "shop-management/payment-proofs",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    stream.end(file.buffer);
  });
};

// Validate and retrieve credit record for payment (supports specific ID or auto resolution)
const getCreditForPayment = async (creditId, userId = null, session = null) => {
  let credit = null;

  if (!creditId || creditId === "general" || creditId === "all" || creditId === "auto") {
    let query = Credit.findOne({
      ...(userId ? { userId } : {}),
      pendingAmount: { $gt: 0 },
    }).sort({ dueDate: 1, createdAt: 1 });
    if (session) query = query.session(session);
    credit = await query;
  } else {
    let query = Credit.findById(creditId);
    if (session) query = query.session(session);
    credit = await query;
  }

  if (!credit) {
    return {
      error: {
        status: 404,
        message: "No pending credit account found to apply payment towards",
      },
    };
  }

  if (!credit.customerId || !credit.userId) {
    return {
      error: {
        status: 400,
        message: "Invalid credit record",
      },
    };
  }

  const pendingAmount = Number(credit.pendingAmount || 0);
  if (pendingAmount <= 0) {
    return {
      error: {
        status: 400,
        message: "This credit is already fully paid",
      },
    };
  }

  return { credit, pendingAmount };
};

const validatePaymentAmount = (amount, pendingAmount) => {
  if (!isValidAmount(amount)) {
    return "Payment amount must be greater than 0";
  }
  if (Number(amount) > Number(pendingAmount)) {
    return "Payment amount cannot be greater than pending amount";
  }
  return null;
};

const ensureCustomerOwnsCredit = (credit, userId) => {
  return credit.userId?.toString() === userId?.toString();
};

// Update credit and customer balances after approved payment
const applyApprovedPayment = async (credit, amount, session = null) => {
  const paymentAmount = Number(amount);
  const currentPending = Number(credit.pendingAmount || 0);

  if (!isValidAmount(paymentAmount)) {
    throw new Error("Invalid approved payment amount");
  }

  if (paymentAmount > currentPending) {
    throw new Error("Payment amount cannot exceed pending amount");
  }

  credit.paidAmount = Number(credit.paidAmount || 0) + paymentAmount;
  credit.pendingAmount = Math.max(0, Number(credit.borrowedAmount || 0) - credit.paidAmount);
  credit.status = credit.pendingAmount === 0 ? "paid" : "partially_paid";

  if (session) {
    await credit.save({ session });
    await Customer.findByIdAndUpdate(
      credit.customerId,
      { $inc: { pendingAmount: -paymentAmount } },
      { session }
    );
  } else {
    await credit.save();
    const customer = await Customer.findById(credit.customerId);
    if (customer) {
      customer.pendingAmount = Math.max(0, Number(customer.pendingAmount || 0) - paymentAmount);
      await customer.save();
    }
  }
};

const paymentPopulate = (query) =>
  query
    .populate("creditId")
    .populate("userId", "name email phone role")
    .populate("recordedBy", "name email role")
    .populate("verifiedBy", "name email role")
    .populate("claimedReceiver", "name email role");

// Create cash or UPI payment record
export async function createPayment(req, res) {
  try {
    const {
      creditId,
      amount,
      paymentMethod,
      transactionId,
      claimedReceiver,
      note,
    } = req.body;

    const paymentProofFile = req.file;

    const errors = {};
    if (!creditId) {
      errors.creditId = "Please select a credit record";
    }

    if (amount === undefined || amount === null || amount === "" || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.amount = "Payment amount must be greater than 0";
    }

    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
      errors.paymentMethod = "Please select a valid payment method (Cash or UPI)";
    }

    if (Object.keys(errors).length > 0) {
      const firstMsg = Object.values(errors)[0];
      return sendValidationError(res, firstMsg, errors);
    }

    const { credit, pendingAmount, error } = await getCreditForPayment(
      creditId,
      isCustomer(req.user.role) ? req.user._id : null
    );
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        errors: { creditId: error.message }
      });
    }

    const paymentAmount = getAmount(amount);
    const amountError = validatePaymentAmount(paymentAmount, pendingAmount);
    if (amountError) {
      return sendValidationError(res, amountError, { amount: amountError });
    }

    if (isCustomer(req.user.role) && !ensureCustomerOwnsCredit(credit, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot make payment for another customer",
      });
    }

    if (!isCustomer(req.user.role) && !isAdmin(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role",
      });
    }

    let status = "pending";
    let recordedBy = null;
    let verifiedBy = null;
    let verifiedAt = null;
    let finalTransactionId = transactionId?.trim() || null;
    let finalPaymentProof = null;
    let finalClaimedReceiver = claimedReceiver || null;

    if (isAdmin(req.user.role)) {
      status = "approved";
      recordedBy = req.user._id;

      if (paymentMethod === "cash") {
        finalTransactionId = null;
        finalPaymentProof = null;
        finalClaimedReceiver = null;
      }

      if (paymentMethod === "upi") {
        finalClaimedReceiver = null;
        if (paymentProofFile) {
          finalPaymentProof = await uploadPaymentProof(paymentProofFile);
        }
      }
    }

    if (isCustomer(req.user.role)) {
      if (paymentMethod === "upi") {
        if (!finalTransactionId && !paymentProofFile) {
          return res.status(400).json({
            success: false,
            message: "Please provide either a UPI Transaction / UTR ID or payment screenshot",
          });
        }

        if (paymentProofFile) {
          try {
            finalPaymentProof = await uploadPaymentProof(paymentProofFile);
          } catch (uploadErr) {
            console.warn("Screenshot upload warning:", uploadErr);
          }
        }
        finalClaimedReceiver = null;
      }

      if (paymentMethod === "cash") {
        if (!finalClaimedReceiver) {
          finalClaimedReceiver = "Store Counter / Staff";
        }
        finalTransactionId = null;
        finalPaymentProof = null;
      }
    }

    const payment = await runTransaction(async (session) => {
      let activeCredit = credit;
      if (session) {
        activeCredit = await Credit.findById(credit._id).session(session);
      }

      const createdPayment = await Payment.create(
        [
          {
            creditId: activeCredit._id,
            customerId: activeCredit.customerId,
            userId: activeCredit.userId,
            amount: paymentAmount,
            paymentMethod,
            status,
            paidAt: new Date(),
            claimedReceiver: finalClaimedReceiver,
            recordedBy,
            verifiedBy,
            verifiedAt,
            transactionId: finalTransactionId,
            paymentProof: finalPaymentProof,
            note: note?.trim() || "",
          }
        ],
        session ? { session } : {}
      );

      if (status === "approved") {
        await applyApprovedPayment(activeCredit, paymentAmount, session);
      }

      return createdPayment[0];
    });

    if (isAdmin(req.user.role)) {
      logAdminActivity({
        admin: req.user,
        req,
        action: "Recorded Payment",
        category: "Payment",
        targetId: payment._id,
        detail: `Recorded ${payment.paymentMethod?.toUpperCase()} payment of ₹${Number(payment.amount || 0).toLocaleString("en-IN")}`,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        status === "approved"
          ? "Payment recorded successfully"
          : "Payment submitted for verification",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

// Create order for online Razorpay checkout
export async function createRazorpayOrder(req, res) {
  try {
    if (!isCustomer(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only customers can make Razorpay payments",
      });
    }

    if (!(await isRazorpayEnabled())) {
      return res.status(403).json({
        success: false,
        message: "Razorpay payment is currently disabled",
      });
    }

    const { creditId, amount } = req.body;
    if (!creditId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Credit and amount are required",
      });
    }

    const { credit, pendingAmount, error } = await getCreditForPayment(
      creditId,
      req.user?._id
    );
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (!ensureCustomerOwnsCredit(credit, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot pay another customer's credit",
      });
    }

    const paymentAmount = getAmount(amount);
    const amountError = validatePaymentAmount(paymentAmount, pendingAmount);
    if (amountError) {
      return res.status(400).json({
        success: false,
        message: amountError,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(paymentAmount * 100),
      currency: "INR",
      receipt: `credit_${credit._id}_${Date.now()}`,
      notes: {
        creditId: credit._id.toString(),
        customerId: credit.customerId.toString(),
        userId: credit.userId.toString(),
      },
    });

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      "";

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      keyId: razorpayKeyId,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayKeyId,
      },
      credit: {
        id: credit._id,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create Razorpay order",
    });
  }
}

// Verify webhook / callback signature and settle credit for Razorpay
export async function verifyRazorpayPayment(req, res) {
  try {
    if (!isCustomer(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only customers can verify Razorpay payments",
      });
    }

    if (!(await isRazorpayEnabled())) {
      return res.status(403).json({
        success: false,
        message: "Razorpay payment is currently disabled",
      });
    }

    const {
      creditId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !creditId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment details are required",
      });
    }

    const existingPayment = await Payment.findOne({
      $or: [
        { razorpayPaymentId: razorpay_payment_id },
        { transactionId: razorpay_payment_id },
      ],
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Razorpay payment already recorded",
        payment: existingPayment,
      });
    }

    const { credit, pendingAmount, error } = await getCreditForPayment(creditId);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (!ensureCustomerOwnsCredit(credit, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot pay another customer's credit",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature))) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (razorpayOrder.notes?.creditId !== credit._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not belong to this credit",
      });
    }

    if (razorpayOrder.notes?.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Razorpay order does not belong to this customer",
      });
    }

    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    if (razorpayPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order mismatch",
      });
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment is not captured",
      });
    }

    const razorpayAmount = Number(razorpayPayment.amount) / 100;
    if (!isValidAmount(razorpayAmount) || razorpayAmount > pendingAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment amount",
      });
    }

    const payment = await runTransaction(async (session) => {
      let activeCredit = credit;
      if (session) {
        activeCredit = await Credit.findById(credit._id).session(session);
      }

      const createdPayment = await Payment.create(
        [
          {
            creditId: activeCredit._id,
            customerId: activeCredit.customerId,
            userId: activeCredit.userId,
            amount: razorpayAmount,
            paymentMethod: "razorpay",
            status: "approved",
            paidAt: new Date(),
            claimedReceiver: null,
            recordedBy: null,
            verifiedBy: null,
            verifiedAt: null,
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentProof: null,
            note: "Razorpay credit payment",
          }
        ],
        session ? { session } : {}
      );

      await applyApprovedPayment(activeCredit, razorpayAmount, session);
      return createdPayment[0];
    });

    return res.status(200).json({
      success: true,
      message: "Razorpay payment successful and credit updated",
      payment,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Razorpay payment verification failed",
    });
  }
}

// Approve pending cash or UPI payment claim
export async function approvePayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be approved",
      });
    }

    if (payment.paymentMethod === "razorpay") {
      return res.status(400).json({
        success: false,
        message: "Razorpay payments do not require admin approval",
      });
    }

    const credit = await Credit.findById(payment.creditId);
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: "Credit record not found",
      });
    }

    if (Number(payment.amount) > Number(credit.pendingAmount)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is greater than pending amount",
      });
    }

    await runTransaction(async (session) => {
      let activePayment = payment;
      let activeCredit = credit;

      if (session) {
        activePayment = await Payment.findById(payment._id).session(session);
        activeCredit = await Credit.findById(credit._id).session(session);
      }

      activePayment.status = "approved";
      activePayment.verifiedBy = req.user._id;
      activePayment.verifiedAt = new Date();
      await activePayment.save(session ? { session } : {});

      await applyApprovedPayment(activeCredit, payment.amount, session);
    });

    if (credit.customerId) {
      syncCustomerTrustAndLimits(credit.customerId).catch((err) => {
        console.warn("Background customer trust sync error after payment:", err);
      });
    }

    // log payment approval activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Approved Payment",
      category: "Payment",
      targetId: payment._id,
      detail: `Approved ${payment.paymentMethod?.toUpperCase()} payment of ₹${Number(payment.amount || 0).toLocaleString("en-IN")}`,
    });

    return res.status(200).json({
      success: true,
      message: "Payment approved successfully",
      payment,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Reject pending payment claim
export async function rejectPayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be rejected",
      });
    }

    if (payment.paymentMethod === "razorpay") {
      return res.status(400).json({
        success: false,
        message: "Razorpay payments do not require rejection",
      });
    }

    payment.status = "rejected";
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    await payment.save();

    // log payment rejection activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Rejected Payment",
      category: "Payment",
      targetId: payment._id,
      detail: `Rejected ${payment.paymentMethod?.toUpperCase()} payment of ₹${Number(payment.amount || 0).toLocaleString("en-IN")}`,
    });

    return res.status(200).json({
      success: true,
      message: "Payment rejected",
      payment,
    });
  } catch (error) {
    console.error("Reject payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get logged-in user's payment history
export async function getMyPayments(req, res) {
  try {
    const payments = await paymentPopulate(
      Payment.find({ userId: req.user._id }).sort({ paidAt: -1 })
    );

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get my payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get payments for a specific customer
export async function getCustomerPayments(req, res) {
  try {
    const { customerId } = req.params;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const payments = await paymentPopulate(
      Payment.find({ customerId }).sort({ paidAt: -1 })
    );

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get customer payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get all system payments
export async function getAllPayments(req, res) {
  try {
    const payments = await paymentPopulate(
      Payment.find().populate("customerId").sort({ paidAt: -1 })
    );

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get payments pending review
export async function getPendingPayments(req, res) {
  try {
    const payments = await Payment.find({ status: "pending" })
      .populate("customerId")
      .populate("userId", "name email role")
      .populate("creditId")
      .populate("claimedReceiver", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get single payment details
export async function getPaymentById(req, res) {
  try {
    const { id } = req.params;
    const payment = await paymentPopulate(Payment.findById(id));

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}