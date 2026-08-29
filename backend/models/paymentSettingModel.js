import mongoose from "mongoose";

const paymentSettingSchema = new mongoose.Schema(
  {
    razorpayEnabled: {
      type: Boolean,
      default: false,
    },
    razorpayMessage: {
      type: String,
      default: "In case of emergency, use Razorpay for payment.",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const paymentSettingModel = mongoose.models.PaymentSetting || mongoose.model("PaymentSetting", paymentSettingSchema);

export default paymentSettingModel;