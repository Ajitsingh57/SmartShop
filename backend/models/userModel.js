import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        // Unique login username for admins and superadmins
        username: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        // Optional login identifier for customers
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true
        },
        // Optional login identifier for customers
        phone: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["customer", "admin", "superadmin"],
            default: "customer"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deactivatedAt: {
            type: Date,
            default: null
        },
        resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpire: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;