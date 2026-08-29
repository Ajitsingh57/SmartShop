import mongoose from "mongoose";

const creditSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        borrowedAmount: {
            type: Number,
            required: true,
            min: 1
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        pendingAmount: {
            type: Number,
            required: true,
            min: 0
        },
        borrowDate: {
            type: Date,
            default: Date.now
        },
        dueDate: {
            type: Date,
            required: true
        },
        // One-time due date extension tracker
        extensionCount: {
            type: Number,
            default: 0,
            min: 0,
            max: 1
        },
        extension: {
            oldDueDate: {
                type: Date,
                default: null
            },
            newDueDate: {
                type: Date,
                default: null
            },
            reason: {
                type: String,
                trim: true,
                default: null
            },
            extendedAt: {
                type: Date,
                default: null
            },
            extendedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            }
        },
        status: {
            type: String,
            enum: ["active", "partially_paid", "paid", "overdue"],
            default: "active",
            index: true
        }
    },
    {
        timestamps: true
    }
);

const creditModel = mongoose.models.Credit || mongoose.model("Credit", creditSchema);

export default creditModel;