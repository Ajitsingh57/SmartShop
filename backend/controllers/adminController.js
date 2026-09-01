import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import Sale from "../models/saleModel.js";
import Payment from "../models/paymentModel.js";
import Return from "../models/returnModel.js";
import Product from "../models/productModel.js";
import Activity from "../models/activityModel.js";
import { logAdminActivity } from "../utils/activityLogger.js";

// Fetch all admin accounts (superadmin only)
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: admins.length,
            admins
        });
    } catch (error) {
        console.error("Get All Admins Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admins"
        });
    }
};

// Fetch single admin account by id
export const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await User.findOne({ _id: id, role: { $in: ["admin", "superadmin"] } }).select("-password");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.status(200).json({
            success: true,
            admin
        });
    } catch (error) {
        console.error("Get Admin By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin"
        });
    }
};

// Fetch logged-in administrator profile details and statistics
export const getMyAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found"
            });
        }

        const [salesCount, paymentsVerifiedCount, productsCount] = await Promise.all([
            Sale.countDocuments({ adminId: user._id }),
            Payment.countDocuments({ $or: [{ recordedBy: user._id }, { verifiedBy: user._id }] }),
            Product.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            admin: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role === "superadmin" ? "Super Administrator" : "Store Administrator",
                rawRole: user.role,
                isActive: user.isActive,
                status: user.isActive !== false ? "Active" : "Inactive",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                stats: {
                    salesRecorded: salesCount,
                    paymentsVerified: paymentsVerifiedCount,
                    totalProducts: productsCount
                }
            }
        });
    } catch (error) {
        console.error("Get My Admin Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin profile"
        });
    }
};

// Update logged in admin profile (name, phone)
export const updateMyAdminProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin account not found"
            });
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }
            user.name = name.trim();
        }

        if (phone !== undefined) {
            user.phone = phone ? phone.trim() : undefined;
        }

        await user.save();

        const adminResponse = user.toObject();
        delete adminResponse.password;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error("Update Admin Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};

// Create a new admin account
export const createAdmin = async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, username and password are required"
            });
        }

        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await User.create({
            name: name.trim(),
            username: username.trim(),
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        // log admin creation activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Created Admin",
            category: "Admin",
            targetId: admin._id,
            targetName: admin.name,
            detail: `Created new admin account for ${admin.name} (@${admin.username})`
        });

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error("Create Admin Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create admin"
        });
    }
};

// Update admin details
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password } = req.body;

        const admin = await User.findOne({ _id: id, role: "admin" });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (name === undefined && username === undefined && password === undefined) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }
            admin.name = name.trim();
        }

        if (username !== undefined) {
            if (!username.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Username cannot be empty"
                });
            }

            const existingUser = await User.findOne({
                username: username.trim(),
                _id: { $ne: id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username already exists"
                });
            }

            admin.username = username.trim();
        }

        if (password !== undefined) {
            if (!password.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Password cannot be empty"
                });
            }
            admin.password = await bcrypt.hash(password, 10);
        }

        await admin.save();

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        // log admin update activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Updated Admin",
            category: "Admin",
            targetId: admin._id,
            targetName: admin.name,
            detail: `Updated admin profile/credentials for ${admin.name} (@${admin.username})`
        });

        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            admin: adminResponse
        });
    } catch (error) {
        console.error("Update Admin Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update admin"
        });
    }
};

// Toggle admin active status
export const updateAdminStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isActive } = req.body;

        const admin = await User.findOne({ _id: id, role: "admin" });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (isActive !== undefined) {
            admin.isActive = Boolean(isActive);
        } else if (status !== undefined) {
            admin.isActive = status === "Active" || status === true;
        }

        await admin.save();

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        // log admin status toggle activity
        logAdminActivity({
            admin: req.user,
            req,
            action: admin.isActive ? "Activated Admin" : "Deactivated Admin",
            category: "Admin",
            targetId: admin._id,
            targetName: admin.name,
            detail: `${admin.isActive ? "Activated" : "Deactivated"} admin account for ${admin.name} (@${admin.username})`
        });

        res.status(200).json({
            success: true,
            message: `Admin status updated successfully`,
            admin: adminResponse
        });
    } catch (error) {
        console.error("Update Admin Status Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update admin status"
        });
    }
};

// Permanently delete an admin account
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await User.findOneAndDelete({ _id: id, role: "admin" });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        // log admin deletion activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Deleted Admin",
            category: "Admin",
            targetId: admin._id,
            targetName: admin.name,
            detail: `Deleted admin account for ${admin.name} (@${admin.username})`
        });

        res.status(200).json({
            success: true,
            message: "Admin deleted successfully"
        });
    } catch (error) {
        console.error("Delete Admin Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete admin"
        });
    }
};

// Fetch real audit trail of admin actions across all store operations
export const getAdminActivities = async (req, res) => {
    try {
        // fetch recorded activities from Activity collection
        const recordedActivities = await Activity.find()
            .populate("adminId", "name username email")
            .sort({ createdAt: -1 })
            .limit(100);

        const activities = [];

        for (const act of recordedActivities) {
            const admin = act.adminId;
            const adminName = act.adminName || admin?.name || "Admin";
            const username = act.username || admin?.username || admin?.email || "admin";

            activities.push({
                id: `act_${act._id}`,
                adminId: admin?._id || act.adminId || null,
                adminName,
                username,
                action: act.action,
                category: act.category,
                detail: act.detail,
                date: new Date(act.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                createdAt: act.createdAt
            });
        }

        // fallback synthesize recent sales, payments, returns, products if needed
        const [defaultAdmin, sales, payments, returns, products] = await Promise.all([
            User.findOne({ role: { $in: ["admin", "superadmin"] }, isActive: true }).sort({ createdAt: 1 }),
            Sale.find()
                .populate("adminId", "name username email")
                .populate("customerId")
                .sort({ createdAt: -1 })
                .limit(30),
            Payment.find({ $or: [{ recordedBy: { $ne: null } }, { verifiedBy: { $ne: null } }, { status: { $in: ["approved", "rejected"] } }] })
                .populate("recordedBy", "name username email")
                .populate("verifiedBy", "name username email")
                .populate("customerId")
                .sort({ updatedAt: -1 })
                .limit(30),
            Return.find()
                .populate("adminId", "name username email")
                .sort({ returnedAt: -1 })
                .limit(30),
            Product.find()
                .populate("updatedBy", "name username email")
                .populate("createdBy", "name username email")
                .sort({ updatedAt: -1 })
                .limit(20)
        ]);

        for (const sale of sales) {
            const saleIdStr = String(sale._id);
            if (!activities.some((a) => a.id.includes(saleIdStr) || a.detail?.includes(saleIdStr))) {
                const admin = sale.adminId || defaultAdmin;
                if (admin) {
                    activities.push({
                        id: `sale_${sale._id}`,
                        adminId: admin._id,
                        adminName: admin.name,
                        username: admin.username || admin.email || "admin",
                        action: "Created Sale",
                        category: "Sale",
                        detail: `Sale of ₹${Number(sale.totalAmount || 0).toLocaleString("en-IN")} recorded (${sale.paymentType})`,
                        date: new Date(sale.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }),
                        createdAt: sale.createdAt
                    });
                }
            }
        }

        for (const payment of payments) {
            const payIdStr = String(payment._id);
            if (!activities.some((a) => a.id.includes(payIdStr) || a.detail?.includes(payIdStr))) {
                const admin = payment.verifiedBy || payment.recordedBy || defaultAdmin;
                if (admin) {
                    const action =
                        payment.status === "approved"
                            ? "Approved Payment"
                            : payment.status === "rejected"
                            ? "Rejected Payment"
                            : "Recorded Payment";

                    activities.push({
                        id: `pay_${payment._id}`,
                        adminId: admin._id,
                        adminName: admin.name,
                        username: admin.username || admin.email || "admin",
                        action,
                        category: "Payment",
                        detail: `${payment.paymentMethod?.toUpperCase()} payment of ₹${Number(payment.amount || 0).toLocaleString("en-IN")} ${payment.status}`,
                        date: new Date(payment.verifiedAt || payment.updatedAt || payment.paidAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }),
                        createdAt: payment.verifiedAt || payment.updatedAt || payment.paidAt
                    });
                }
            }
        }

        for (const ret of returns) {
            const retIdStr = String(ret._id);
            if (!activities.some((a) => a.id.includes(retIdStr) || a.detail?.includes(retIdStr))) {
                const admin = ret.adminId || defaultAdmin;
                if (admin) {
                    activities.push({
                        id: `ret_${ret._id}`,
                        adminId: admin._id,
                        adminName: admin.name,
                        username: admin.username || admin.email || "admin",
                        action: "Processed Return",
                        category: "Return",
                        detail: `Return of ₹${Number(ret.returnAmount || 0).toLocaleString("en-IN")} processed (${ret.refundMethod})`,
                        date: new Date(ret.returnedAt || ret.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }),
                        createdAt: ret.returnedAt || ret.createdAt
                    });
                }
            }
        }

        for (const product of products) {
            const prodIdStr = String(product._id);
            if (!activities.some((a) => a.id.includes(prodIdStr) || a.detail?.includes(prodIdStr))) {
                const admin = product.updatedBy || product.createdBy || defaultAdmin;
                const adminId = admin ? admin._id : (defaultAdmin ? defaultAdmin._id : null);
                const adminName = admin ? admin.name : (defaultAdmin ? defaultAdmin.name : "Admin");
                const username = admin ? (admin.username || admin.email || "admin") : (defaultAdmin ? (defaultAdmin.username || defaultAdmin.email) : "admin");

                activities.push({
                    id: `prod_${product._id}`,
                    adminId,
                    adminName,
                    username,
                    action: "Updated Product",
                    category: "Product",
                    detail: `Product "${product.name}" updated (Stock: ${product.stock}, Price: ₹${product.price})`,
                    date: new Date(product.updatedAt || product.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    createdAt: product.updatedAt || product.createdAt
                });
            }
        }

        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return res.status(200).json({
            success: true,
            count: activities.length,
            activities: activities.slice(0, 100)
        });
    } catch (error) {
        console.error("Get Admin Activities Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin activities"
        });
    }
};