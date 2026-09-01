import mongoose from "mongoose";

// Schema for customer product requests (restock or new item)
const productRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone number is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    requestType: {
      type: String,
      enum: ["restock", "new_product"],
      default: "new_product",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    requestedQuantity: {
      type: Number,
      required: [true, "Requested quantity is required"],
      min: [0.01, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      default: "pcs",
    },
    targetPrice: {
      type: Number,
      min: [0, "Target price cannot be negative"],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "in_procurement", "available", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup by status and customer
productRequestSchema.index({ status: 1, createdAt: -1 });
productRequestSchema.index({ customer: 1, createdAt: -1 });
productRequestSchema.index({ customerPhone: 1, createdAt: -1 });

const ProductRequest =
  mongoose.models.ProductRequest ||
  mongoose.model("ProductRequest", productRequestSchema);

export default ProductRequest;
