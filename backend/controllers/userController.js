import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";
import Customer from "../models/customerModel.js";
import Credit from "../models/creditModel.js";
import Payment from "../models/paymentModel.js";
import Sale from "../models/saleModel.js";
import Return from "../models/returnModel.js";
import { calculateCustomerTrustScoreAndLimits, syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { isValidName, isValidPhone, isValidUsername, isValidEmail, sendValidationError } from "../utils/helpers.js";

const TOKEN_EXPIRES_IN = "24h";
const JWT_SECRET = process.env.JWT_SECRET;

// Register new customer account and create profile ledger
export async function register(req, res) {
    const session = await User.startSession();

    try {
        const { name, email, phone, password, username } = req.body;

        const errors = {};

        if (!name || !isValidName(name)) {
            errors.name = "Please enter your full name (letters and spaces only, min 2 characters)";
        }

        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters long";
        }

        if (!email && !phone && !username) {
            errors.phone = "Please provide at least a mobile number or email address";
            errors.email = "Please provide at least a mobile number or email address";
        }

        const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
        if (normalizedEmail) {
            if (!normalizedEmail.includes("@")) {
                errors.email = "Email address must include '@' symbol (e.g. name@example.com)";
            } else if (!isValidEmail(normalizedEmail)) {
                errors.email = "Please enter a valid email address (e.g. name@example.com)";
            }
        }

        const normalizedPhone = phone ? phone.trim().replace(/[\s\-()]/g, "") : undefined;
        if (normalizedPhone && !isValidPhone(normalizedPhone)) {
            errors.phone = "Please enter a valid 10-digit mobile number";
        }

        const normalizedUsername = username ? username.trim() : undefined;
        if (normalizedUsername && !isValidUsername(normalizedUsername)) {
            errors.username = "Username must be 3-30 characters (letters and numbers only)";
        }

        if (Object.keys(errors).length > 0) {
            const firstMsg = Object.values(errors)[0];
            return sendValidationError(res, firstMsg, errors);
        }

        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const conditions = [];
        if (normalizedEmail) conditions.push({ email: normalizedEmail });
        if (normalizedPhone) conditions.push({ phone: normalizedPhone });
        if (normalizedUsername) conditions.push({ username: normalizedUsername });

        if (conditions.length > 0) {
            const existingUser = await User.findOne({ $or: conditions });
            if (existingUser) {
                if (normalizedEmail && existingUser.email === normalizedEmail) {
                    return res.status(409).json({
                        success: false,
                        message: "This email address is already registered. Please sign in or use another email.",
                        errors: { email: "This email address is already registered" }
                    });
                }
                if (normalizedPhone && existingUser.phone === normalizedPhone) {
                    return res.status(409).json({
                        success: false,
                        message: "This mobile number is already registered. Please sign in or use another number.",
                        errors: { phone: "This mobile number is already registered" }
                    });
                }
                if (normalizedUsername && existingUser.username === normalizedUsername) {
                    return res.status(409).json({
                        success: false,
                        message: "This username is already taken. Please choose another username.",
                        errors: { username: "This username is already taken" }
                    });
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let user;

        await session.withTransaction(async () => {
            const users = await User.create(
                [
                    {
                        name: name.trim(),
                        username: normalizedUsername,
                        email: normalizedEmail,
                        phone: normalizedPhone,
                        password: hashedPassword,
                        role: "customer",
                        isActive: true
                    }
                ],
                { session }
            );

            user = users[0];

            await Customer.create(
                [
                    {
                        userId: user._id,
                        totalPurchase: 0,
                        trustScore: 0,
                        maxBorrowAmount: 0,
                        pendingAmount: 0,
                        manualBorrowLimit: 0
                    }
                ],
                { session }
            );
        });

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Registration error:", err);
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email, phone or customer account already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    } finally {
        await session.endSession();
    }
}

// User login (supports username, email or phone)
export async function login(req, res) {
    try {
        const { identifier, password } = req.body;

        const errors = {};
        if (!identifier || !identifier.trim()) {
            errors.identifier = "Please enter your username, email, or mobile number";
        }
        if (!password) {
            errors.password = "Please enter your password";
        }

        if (Object.keys(errors).length > 0) {
            const firstMsg = Object.values(errors)[0];
            return sendValidationError(res, firstMsg, errors);
        }

        const value = identifier.trim();
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        let user;
        if (validator.isEmail(value)) {
            user = await User.findOne({ email: value.toLowerCase() });
        } else {
            user = await User.findOne({
                $or: [{ phone: value }, { username: value }]
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Incorrect username/email/mobile or password. Please try again.",
                errors: {
                    identifier: "Incorrect credentials",
                    password: "Incorrect credentials"
                }
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is currently disabled. Please contact the administrator.",
                errors: {
                    identifier: "This account is currently disabled"
                }
            });
        }

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "Password login is not available for this account",
                errors: {
                    password: "Password login not configured"
                }
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect username/email/mobile or password. Please try again.",
                errors: {
                    identifier: "Incorrect credentials",
                    password: "Incorrect credentials"
                }
            });
        }

        if (user.role === "customer") {
            let customer = await Customer.findOne({ userId: user._id });
            if (!customer) {
                customer = await Customer.create({
                    userId: user._id,
                    totalPurchase: 0,
                    trustScore: 0,
                    maxBorrowAmount: 0,
                    pendingAmount: 0,
                    manualBorrowLimit: 0
                });
            }
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Fetch all customers for admin listing
export async function getAllCustomers(req, res) {
    try {
        const customers = await Customer.find()
            .populate(
                "userId",
                "name username email phone role isActive deactivatedAt createdAt updatedAt"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (err) {
        console.error("Get all customers error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Fetch complete customer dossier with all transaction history
export async function getCustomerById(req, res) {
    try {
        const { id } = req.params;

        let user = await User.findOne({ _id: id, role: "customer" }).select("-password");
        let customer;

        if (!user) {
            customer = await Customer.findById(id);
            if (customer) {
                user = await User.findOne({ _id: customer.userId, role: "customer" }).select("-password");
            }
        } else {
            customer = await Customer.findOne({ userId: user._id });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (!customer) {
            customer = await Customer.create({
                userId: user._id,
                totalPurchase: 0,
                trustScore: 0,
                maxBorrowAmount: 0,
                pendingAmount: 0,
                manualBorrowLimit: 0
            });
        }

        const customerIds = [customer._id, user._id];

        const [sales, credits, payments, returns] = await Promise.all([
            Sale.find({ customerId: { $in: customerIds } })
                .populate("adminId", "name username email phone")
                .populate("items.productId", "name price")
                .sort({ createdAt: -1 }),
            Credit.find({ $or: [{ customerId: { $in: customerIds } }, { userId: user._id }] })
                .populate("extension.extendedBy", "name username email")
                .sort({ createdAt: -1 }),
            Payment.find({ $or: [{ customerId: { $in: customerIds } }, { userId: user._id }] })
                .populate("recordedBy", "name username email")
                .populate("verifiedBy", "name username email")
                .populate("claimedReceiver", "name username email")
                .sort({ paidAt: -1 }),
            Return.find({ customerId: { $in: customerIds } })
                .populate("saleId")
                .populate("adminId", "name username email phone")
                .populate("items.productId", "name price")
                .sort({ returnedAt: -1 })
        ]);

        const totalSaleAmount = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
        const totalCreditBorrowed = credits.reduce((sum, credit) => sum + Number(credit.borrowedAmount || 0), 0);
        const totalCreditPaid = credits.reduce((sum, credit) => sum + Number(credit.paidAmount || 0), 0);
        const totalCreditPending = credits.reduce((sum, credit) => sum + Number(credit.pendingAmount || 0), 0);
        const totalPaymentAmount = payments
            .filter(payment => payment.status === "approved")
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const totalReturnAmount = returns.reduce((sum, item) => sum + Number(item.returnAmount || 0), 0);

        const calculated = calculateCustomerTrustScoreAndLimits({
            totalPurchase: totalSaleAmount || customer.totalPurchase,
            sales,
            credits,
            payments
        });

        customer.trustScore = calculated.trustScore;
        customer.maxBorrowAmount = calculated.autoCreditLimit;
        customer.pendingAmount = totalCreditPending;
        customer.totalPurchase = Math.max(Number(customer.totalPurchase || 0), totalSaleAmount);
        customer.save().catch(e => console.warn("Background customer update save err:", e));

        const activeMode = customer.creditLimitMode || "auto";
        const autoLimit = Number(customer.maxBorrowAmount || 0);
        const manualLimit = Number(customer.manualBorrowLimit || 0);
        const effectiveLimit = activeMode === "manual" ? manualLimit : autoLimit;
        const isManualOverride = activeMode === "manual";

        return res.status(200).json({
            success: true,
            customer: {
                profile: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    deactivatedAt: user.deactivatedAt,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                summary: {
                    customerId: customer._id,
                    creditLimitMode: activeMode,
                    totalPurchase: totalSaleAmount || customer.totalPurchase,
                    trustScore: customer.trustScore,
                    trustTier: calculated.trustTier,
                    trustBreakdown: calculated.breakdown,
                    maxBorrowAmount: autoLimit,
                    autoBorrowLimit: autoLimit,
                    manualBorrowLimit: manualLimit,
                    effectiveBorrowLimit: effectiveLimit,
                    isManualOverride,
                    pendingAmount: totalCreditPending || customer.pendingAmount,
                    totalSaleAmount,
                    totalCreditBorrowed,
                    totalCreditPaid,
                    totalCreditPending,
                    totalPaymentAmount,
                    totalReturnAmount,
                    totalSales: sales.length,
                    totalCredits: credits.length,
                    totalPayments: payments.length,
                    totalReturns: returns.length
                },
                records: {
                    sales,
                    credits,
                    payments,
                    returns
                }
            }
        });
    } catch (err) {
        console.error("Get customer details error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Update customer details from admin portal
export async function updateCustomer(req, res) {
    try {
        const { id } = req.params;
        const { name, username, email, phone, password, manualBorrowLimit, creditLimitMode } = req.body;

        let user = await User.findOne({ _id: id, role: "customer" });
        let customer;

        if (!user) {
            customer = await Customer.findById(id);
            if (customer) {
                user = await User.findOne({ _id: customer.userId, role: "customer" });
            }
        } else {
            customer = await Customer.findOne({ userId: user._id });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (name !== undefined) {
            if (!isValidName(name)) {
                return sendValidationError(res, "Please enter a valid full name (letters and spaces only, min 2 characters)", {
                    name: "Please enter a valid full name (letters and spaces only)"
                });
            }
            user.name = name.trim();
        }

        if (username !== undefined) {
            if (username !== null && username !== "") {
                const normalizedUsername = username.trim();
                if (!isValidUsername(normalizedUsername)) {
                    return sendValidationError(res, "Username must be 3-30 characters with letters and numbers (no special symbols)", {
                        username: "Username must be 3-30 characters (letters and numbers only)"
                    });
                }

                const existingUsername = await User.findOne({
                    username: normalizedUsername,
                    _id: { $ne: user._id }
                });

                if (existingUsername) {
                    return res.status(409).json({
                        success: false,
                        message: "This username is already taken. Please choose another username.",
                        errors: { username: "This username is already taken" }
                    });
                }
                user.username = normalizedUsername;
            }
        }

        if (email !== undefined) {
            const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
            if (normalizedEmail && !isValidEmail(normalizedEmail)) {
                return sendValidationError(res, "Please enter a valid email address (e.g. name@example.com)", {
                    email: "Please enter a valid email address"
                });
            }

            if (normalizedEmail) {
                const existingEmail = await User.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id }
                });

                if (existingEmail) {
                    return res.status(409).json({
                        success: false,
                        message: "This email address is already registered.",
                        errors: { email: "This email address is already registered" }
                    });
                }
            }
            user.email = normalizedEmail;
        }

        if (phone !== undefined) {
            const normalizedPhone = phone ? phone.trim().replace(/[\s\-()]/g, "") : undefined;
            if (normalizedPhone && !isValidPhone(normalizedPhone)) {
                return sendValidationError(res, "Please enter a valid 10-digit mobile number", {
                    phone: "Please enter a valid 10-digit mobile number"
                });
            }

            if (normalizedPhone) {
                const existingPhone = await User.findOne({
                    phone: normalizedPhone,
                    _id: { $ne: user._id }
                });

                if (existingPhone) {
                    return res.status(409).json({
                        success: false,
                        message: "This mobile number is already registered.",
                        errors: { phone: "This mobile number is already registered" }
                    });
                }
            }
            user.phone = normalizedPhone;
        }

        if (password !== undefined && password) {
            if (password.length < 6) {
                return sendValidationError(res, "Password must be at least 6 characters long", {
                    password: "Password must be at least 6 characters long"
                });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        if (customer) {
            if (creditLimitMode !== undefined && ["auto", "manual"].includes(creditLimitMode)) {
                customer.creditLimitMode = creditLimitMode;
            }

            if (manualBorrowLimit !== undefined) {
                const limit = Number(manualBorrowLimit);
                if (Number.isFinite(limit) && limit >= 0) {
                    customer.manualBorrowLimit = limit;
                }
            }

            await customer.save();
        }

        return res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                isActive: user.isActive
            }
        });
    } catch (err) {
        console.error("Update customer error:", err);
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Username, email or phone already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Activate / Deactivate customer account
export async function updateCustomerStatus(req, res) {
    try {
        const { id } = req.params;
        const { isActive, status } = req.body;

        const finalStatus =
            typeof isActive === "boolean"
                ? isActive
                : status === "Active" || status === true;

        let customer = await User.findOne({ _id: id, role: "customer" });
        if (!customer) {
            const cust = await Customer.findById(id);
            if (cust) {
                customer = await User.findOne({ _id: cust.userId, role: "customer" });
            }
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        customer.isActive = finalStatus;
        await customer.save();

        // log customer status change activity
        logAdminActivity({
            admin: req.user,
            req,
            action: finalStatus ? "Activated Customer" : "Deactivated Customer",
            category: "Customer",
            targetId: customer._id,
            targetName: customer.name,
            detail: `${finalStatus ? "Activated" : "Deactivated"} customer account for ${customer.name} (${customer.phone || customer.email || customer.username || "Customer"})`
        });

        return res.status(200).json({
            success: true,
            message: finalStatus
                ? "Customer activated successfully"
                : "Customer deactivated successfully",
            customer: {
                id: customer._id,
                name: customer.name,
                username: customer.username,
                role: customer.role,
                isActive: customer.isActive
            }
        });
    } catch (err) {
        console.error("Update customer status error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Delete customer account and all related transactions
export async function deleteCustomer(req, res) {
    const session = await User.startSession();

    try {
        const { id } = req.params;
        let user = await User.findOne({ _id: id, role: "customer" });
        let customer;

        if (!user) {
            customer = await Customer.findById(id);
            if (customer) {
                user = await User.findOne({ _id: customer.userId, role: "customer" });
            }
        } else {
            customer = await Customer.findOne({ userId: user._id });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const deletedCustomerName = user.name;
        const deletedCustomerContact = user.phone || user.email || "";

        await session.withTransaction(async () => {
            if (customer) {
                await Payment.deleteMany({ userId: user._id }, { session });
                await Return.deleteMany({ customerId: customer._id }, { session });
                await Sale.deleteMany({ customerId: customer._id }, { session });
                await Credit.deleteMany({ customerId: customer._id }, { session });
                await Customer.deleteOne({ _id: customer._id }, { session });
            }
            await User.deleteOne({ _id: user._id }, { session });
        });

        // log customer deletion activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Deleted Customer",
            category: "Customer",
            targetId: user._id,
            targetName: deletedCustomerName,
            detail: `Deleted customer account for ${deletedCustomerName} (${deletedCustomerContact}) and wiped related data`
        });

        return res.status(200).json({
            success: true,
            message: "Customer account and all related data deleted successfully"
        });
    } catch (err) {
        console.error("Delete customer error:", err);
        return res.status(500).json({
            success: false,
            message: "Customer deletion failed"
        });
    } finally {
        await session.endSession();
    }
}

// Update profile for authenticated customer
export async function updateMyProfile(req, res) {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        if (name !== undefined) {
            if (!isValidName(name)) {
                return sendValidationError(res, "Please enter a valid full name (letters and spaces only, min 2 characters)", {
                    name: "Please enter a valid full name (letters and spaces only)"
                });
            }
            user.name = name.trim();
        }

        if (phone !== undefined) {
            const normalizedPhone = phone ? phone.trim().replace(/[\s\-()]/g, "") : "";
            if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
                return sendValidationError(res, "Please enter a valid 10-digit mobile number", {
                    phone: "Please enter a valid 10-digit mobile number"
                });
            }

            const existingUser = await User.findOne({
                phone: normalizedPhone,
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "This mobile number is already registered with another account.",
                    errors: { phone: "This mobile number is already registered" }
                });
            }

            user.phone = normalizedPhone;
        }

        await user.save();
        const customer = await Customer.findOne({ userId: user._id });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            customer
        });
    } catch (err) {
        console.error("Update my profile error:", err);
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Phone number already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Fetch self profile details with purchasing and transaction history
export async function getMyProfile(req, res) {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        let customer = await Customer.findOne({ userId: req.user._id });
        if (!customer) {
            customer = await Customer.create({
                userId: req.user._id,
                totalPurchase: 0,
                trustScore: 0,
                maxBorrowAmount: 0,
                pendingAmount: 0,
                manualBorrowLimit: 0
            });
        }

        const customerIds = [customer._id, user._id];
        const [sales, credits, payments] = await Promise.all([
            Sale.find({ customerId: { $in: customerIds } }).sort({ createdAt: -1 }),
            Credit.find({ $or: [{ customerId: { $in: customerIds } }, { userId: user._id }] }).sort({ createdAt: -1 }),
            Payment.find({ $or: [{ customerId: { $in: customerIds } }, { userId: user._id }] }).sort({ paidAt: -1 })
        ]);

        const totalSaleAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
        const totalPendingCredit = credits.reduce((sum, c) => sum + Number(c.pendingAmount || 0), 0);

        return res.status(200).json({
            success: true,
            user,
            customer,
            summary: {
                totalPurchases: totalSaleAmount || customer.totalPurchase || 0,
                totalSalesCount: sales.length,
                pendingCredit: totalPendingCredit || customer.pendingAmount || 0,
                trustScore: customer.trustScore || 0,
                borrowLimit: customer.manualBorrowLimit || customer.maxBorrowAmount || 0
            },
            records: {
                recentSales: sales.slice(0, 10),
                recentCredits: credits.slice(0, 10),
                recentPayments: payments.slice(0, 10)
            }
        });
    } catch (err) {
        console.error("Get my profile error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}