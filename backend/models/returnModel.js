import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
    {
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sale",
            required: true,
            index: true
        },
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
        returnAmount: {
            type: Number,
            required: true,
            min: 0.01
        },
        refundMethod: {
            type: String,
            enum: [
                "cash",
                "upi",
                "credit_adjustment"
            ],
            required: true,
            index: true
        },
        refundStatus: {
            type: String,
            enum: [
                "pending",
                "completed"
            ],
            default: "completed",
            index: true
        },
        transactionId: {
            type: String,
            trim: true,
            default: null,
            index: true
        },
        reason: {
            type: String,
            trim: true,
            default: ""
        },
        returnedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

const returnModel = mongoose.models.Return || mongoose.model("Return", returnSchema);

export default returnModel;