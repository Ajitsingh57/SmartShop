import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    creditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Credit",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "razorpay"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Admin claimed to have received the offline payment
    claimedReceiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
    },
    paymentProof: {
      type: String,
      trim: true,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const paymentModel = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default paymentModel;