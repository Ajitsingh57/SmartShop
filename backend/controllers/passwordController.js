import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET;
const RESET_TOKEN_EXPIRES = "15m";

// Change password for currently authenticated user
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to change password"
        });
    }
};

// Generate password reset token for registered email or phone
export const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier || !String(identifier).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email or phone number is required"
            });
        }

        const value = String(identifier).trim().toLowerCase();

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const user = await User.findOne({
            $or: [
                { email: value },
                { phone: value },
                { username: value }
            ]
        });

        if (!user) {
            // Keep generic response for security
            return res.status(200).json({
                success: true,
                message: "If an account exists with this credential, a password reset token has been generated."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }

        const resetToken = jwt.sign(
            { id: user._id.toString(), type: "password_reset" },
            JWT_SECRET,
            { expiresIn: RESET_TOKEN_EXPIRES }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset token generated successfully",
            resetToken,
            user: {
                name: user.name,
                email: user.email || null,
                phone: user.phone || null
            }
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process forgot password request"
        });
    }
};

// Reset password using verified reset token
export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        let payload;
        try {
            payload = jwt.verify(resetToken, JWT_SECRET);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        if (payload.type !== "password_reset" || !payload.id) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            });
        }

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive"
            });
        }

        // Enforce single-use token validation
        if (
            user.resetPasswordToken !== resetToken ||
            !user.resetPasswordExpire ||
            user.resetPasswordExpire < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset token has already been used or has expired"
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now login with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password"
        });
    }
};