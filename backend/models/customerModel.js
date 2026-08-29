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
        // 0 indicates automatic calculation is active
        manualBorrowLimit: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

const customerModel = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default customerModel;