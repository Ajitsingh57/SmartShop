import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    adminName: {
      type: String,
      default: "Admin",
    },
    username: {
      type: String,
      default: "admin",
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Customer",
        "Credit",
        "Settings",
        "Admin",
        "Product",
        "Category",
        "Sale",
        "Payment",
        "Return",
        "Other",
      ],
      default: "Other",
    },
    targetId: {
      type: String,
      default: null,
    },
    targetName: {
      type: String,
      default: null,
    },
    detail: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ category: 1 });
activitySchema.index({ adminId: 1 });

const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

export default Activity;
