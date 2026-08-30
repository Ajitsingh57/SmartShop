import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        totalPurchase: {
            type: Number,
            default: 0,
            min: 0
        },
        trustScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        // Auto computed max credit limit from Trust Engine
        maxBorrowAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        pendingAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        // Manual custom credit limit set by Admin (persists independently)
        manualBorrowLimit: {
            type: Number,
            default: 0,
            min: 0
        },
        // Active mode toggle: "auto" (Trust Engine limit) or "manual" (Admin set custom limit)
        creditLimitMode: {
            type: String,
            enum: ["auto", "manual"],
            default: "auto"
        }
    },
    {
        timestamps: true
    }
);

const customerModel = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default customerModel;