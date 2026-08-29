import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        unit: {
            type: String,
            required: true,
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
            ]
        },
        lowStockLimit: {
            type: Number,
            default: 0,
            min: 0
        },
        available: {
            type: Boolean,
            default: true
        },
        // Soft delete flag to preserve historical sales records
        deleted: {
            type: Boolean,
            default: false
        },
        image: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;