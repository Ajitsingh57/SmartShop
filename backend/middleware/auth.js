import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token and attach user to request
export default async function authMiddleware(req, res, next) {
    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not defined");
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token is missing"
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token is missing"
            });
        }

        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent inactive users from accessing endpoints
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive"
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({
            success: false,
            message: "Token invalid or expired"
        });
    }
}