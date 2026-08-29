import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
            index: true
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        items: {
            type: [
                {
                    productId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Product",
                        default: null
                    },
                    productName: {
                        type: String,
                        trim: true,
                        default: "Unrecorded item"
                    },
                    quantity: {
                        type: Number,
                        min: 0.001,
                        default: null
                    },
                    unit: {
                        type: String,
                        enum: [
                            "piece",
                            "kg",
                            "gram",
                            "liter",
                            "ml",
                            "meter",
                            "box",
                            "packet",
                            "dozen"
                        ],
                        default: null
                    },
                    price: {
                        type: Number,
                        min: 0,
                        default: null
                    },
                    total: {
                        type: Number,
                        min: 0,
                        default: null
                    }
                }
            ],
            default: []
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0.01
        },
        paymentType: {
            type: String,
            required: true,
            enum: [
                "cash",
                "upi",
                "credit",
                "partial"
            ],
            index: true
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        pendingAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        // For partial payments, specifies whether initial amount was paid via cash or upi
        partialPaymentType: {
            type: String,
            enum: [
                "cash",
                "upi",
                null
            ],
            default: null
        },
        creditId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Credit",
            default: null,
            index: true
        },
        status: {
            type: String,
            enum: [
                "completed",
                "partially_returned",
                "returned",
                "cancelled"
            ],
            default: "completed",
            index: true
        }
    },
    {
        timestamps: true
    }
);

const saleModel = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export default saleModel;