import PaymentSetting from "../models/paymentSettingModel.js";
import { logAdminActivity } from "../utils/activityLogger.js";

// Fetch payment gateway configuration
export async function getPaymentSettings(req, res) {
  try {
    let settings = await PaymentSetting.findOne();

    if (!settings) {
      settings = await PaymentSetting.create({
        razorpayEnabled: false,
        razorpayMessage: "In case of emergency, use Razorpay for payment.",
      });
    }

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      "";

    return res.status(200).json({
      success: true,
      settings: {
        razorpayEnabled: settings.razorpayEnabled,
        razorpayMessage: settings.razorpayMessage,
        keyId: razorpayKeyId,
      },
    });
  } catch (err) {
    console.error("Get payment settings error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Toggle Razorpay enablement
export async function updateRazorpaySetting(req, res) {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled must be true or false",
      });
    }

    let settings = await PaymentSetting.findOne();
    if (!settings) {
      settings = new PaymentSetting();
    }

    settings.razorpayEnabled = enabled;
    settings.updatedBy = req.user._id;
    await settings.save();

    // log payment gateway toggle activity
    logAdminActivity({
      admin: req.user,
      req,
      action: enabled ? "Enabled Razorpay" : "Disabled Razorpay",
      category: "Settings",
      targetId: settings._id,
      targetName: "Razorpay Gateway",
      detail: `${enabled ? "Enabled" : "Disabled"} Razorpay payment gateway in store settings`,
    });

    return res.status(200).json({
      success: true,
      message: enabled ? "Razorpay enabled successfully" : "Razorpay disabled successfully",
      settings: {
        razorpayEnabled: settings.razorpayEnabled,
        razorpayMessage: settings.razorpayMessage,
        updatedBy: settings.updatedBy,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update Razorpay setting error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}