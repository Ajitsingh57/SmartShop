import Customer from "../models/customerModel.js";
import User from "../models/userModel.js";
import Credit from "../models/creditModel.js";
import Payment from "../models/paymentModel.js";
import Sale from "../models/saleModel.js";
import Return from "../models/returnModel.js";
import { calculateCustomerTrustScoreAndLimits, syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { isValidName, isValidPhone, isValidEmail, sendValidationError } from "../utils/helpers.js";

// Fetch customer profile for authenticated user
export const getMyProfile = async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user._id })
            .populate("userId", "name email phone role isActive")
            .lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error("Get my profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update profile details (allows editing name and adding missing email/phone)
export const updateMyProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
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

        // Add email only if user didn't have one
        if (email !== undefined) {
            const trimmedEmail = String(email).trim().toLowerCase();
            if (!isValidEmail(trimmedEmail)) {
                return sendValidationError(res, "Please enter a valid email address (e.g. name@example.com)", {
                    email: "Please enter a valid email address"
                });
            }

            if (user.email) {
                if (trimmedEmail !== user.email) {
                    return sendValidationError(res, "Registered email address cannot be changed", {
                        email: "Existing email cannot be modified"
                    });
                }
            } else {
                const existingUser = await User.findOne({
                    email: trimmedEmail,
                    _id: { $ne: user._id }
                });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "This email address is already registered with another account.",
                        errors: { email: "This email address is already registered" }
                    });
                }
                user.email = trimmedEmail;
            }
        }

        // Add phone only if user didn't have one
        if (phone !== undefined) {
            const trimmedPhone = String(phone).trim().replace(/[\s\-()]/g, "");
            if (!isValidPhone(trimmedPhone)) {
                return sendValidationError(res, "Please enter a valid 10-digit mobile number", {
                    phone: "Please enter a valid 10-digit mobile number"
                });
            }

            if (user.phone) {
                if (trimmedPhone !== user.phone) {
                    return sendValidationError(res, "Registered mobile number cannot be changed", {
                        phone: "Existing phone number cannot be modified"
                    });
                }
            } else {
                const existingUser = await User.findOne({
                    phone: trimmedPhone,
                    _id: { $ne: user._id }
                });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "This mobile number is already registered with another account.",
                        errors: { phone: "This mobile number is already registered" }
                    });
                }
                user.phone = trimmedPhone;
            }
        }

        await user.save();
        const customer = await Customer.findOne({ userId: user._id });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email || null,
                phone: user.phone || null,
                role: user.role
            },
            customer
        });
    } catch (error) {
        console.error("Update my profile error:", error);

        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists"
                });
            }
            if (error.keyPattern?.phone) {
                return res.status(409).json({
                    success: false,
                    message: "Phone number already exists"
                });
            }
            return res.status(409).json({
                success: false,
                message: "Email or phone number already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get single customer details by id
export const getCustomerById = async (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = await Customer.findById(customerId).populate(
            "userId",
            "name email phone role isActive createdAt"
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error("Get customer error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch list of all customers with summarized history
export async function getAllCustomers(req, res) {
    try {
        const customers = await Customer.find()
            .populate(
                "userId",
                "name username email phone role isActive deactivatedAt createdAt updatedAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        const customerIds = customers.map((c) => c._id);

        // Fetch related records in single batch queries instead of N+1 database hits
        const [allCredits, allSales, allReturns] = await Promise.all([
            Credit.find({ customerId: { $in: customerIds } }).sort({ createdAt: -1 }).lean(),
            Sale.find({ customerId: { $in: customerIds } }).sort({ createdAt: -1 }).lean(),
            Return.find({ customerId: { $in: customerIds } }).sort({ createdAt: -1 }).lean()
        ]);

        // Group related data in-memory by customerId for O(1) retrieval
        const creditsMap = new Map();
        const salesMap = new Map();
        const returnsMap = new Map();

        for (const credit of allCredits) {
            const cid = String(credit.customerId);
            if (!creditsMap.has(cid)) creditsMap.set(cid, []);
            creditsMap.get(cid).push(credit);
        }

        for (const sale of allSales) {
            const cid = String(sale.customerId);
            if (!salesMap.has(cid)) salesMap.set(cid, []);
            salesMap.get(cid).push(sale);
        }

        for (const ret of allReturns) {
            const cid = String(ret.customerId);
            if (!returnsMap.has(cid)) returnsMap.set(cid, []);
            returnsMap.get(cid).push(ret);
        }

        const formattedCustomers = customers.map((customer) => {
            const user = customer.userId;
            const cid = String(customer._id);

            if (!user) {
                return {
                    user: null,
                    profile: {
                        _id: customer._id,
                        userId: customer.userId,
                        totalPurchase: Number(customer.totalPurchase || 0),
                        trustScore: Number(customer.trustScore || 0),
                        maxBorrowAmount: Number(customer.maxBorrowAmount || 0),
                        pendingAmount: Number(customer.pendingAmount || 0),
                        manualBorrowLimit: Number(customer.manualBorrowLimit || 0)
                    },
                    credits: creditsMap.get(cid) || [],
                    sales: salesMap.get(cid) || [],
                    returns: returnsMap.get(cid) || []
                };
            }

            const credits = creditsMap.get(cid) || [];
            const sales = salesMap.get(cid) || [];
            const returns = returnsMap.get(cid) || [];

            const autoLimit = Number(customer.maxBorrowAmount || 0);
            const manualLimit = Number(customer.manualBorrowLimit || 0);
            const effectiveLimit = manualLimit > 0 ? manualLimit : autoLimit;
            const isManualOverride = manualLimit > 0;

            return {
                user: {
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
                profile: {
                    _id: customer._id,
                    userId: customer.userId,
                    totalPurchase: Number(customer.totalPurchase || 0),
                    trustScore: Number(customer.trustScore || 0),
                    maxBorrowAmount: autoLimit,
                    autoBorrowLimit: autoLimit,
                    manualBorrowLimit: manualLimit,
                    effectiveBorrowLimit: effectiveLimit,
                    isManualOverride,
                    pendingAmount: Number(customer.pendingAmount || 0),
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt
                },
                credits,
                sales,
                returns
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedCustomers.length,
            customers: formattedCustomers
        });
    } catch (err) {
        console.error("Get all customers error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Get customer credit history
export const getMyCreditHistory = async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user._id }).lean();
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const credits = await Credit.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            credits
        });
    } catch (error) {
        console.error("Get my credit history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get customer payment history
export const getMyPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user._id })
            .populate("creditId")
            .populate("recordedBy", "name email role")
            .populate("verifiedBy", "name email role")
            .sort({ paidAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            payments
        });
    } catch (error) {
        console.error("Get my payment history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get customer sales history
export const getMySaleHistory = async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user._id }).lean();
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const sales = await Sale.find({ customerId: customer._id })
            .populate("adminId", "name email role")
            .populate("creditId")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            sales
        });
    } catch (error) {
        console.error("Get my sale history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get customer return history
export const getMyReturnHistory = async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user._id }).lean();
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const returns = await Return.find({ customerId: customer._id })
            .populate("saleId")
            .populate("adminId", "name email role")
            .sort({ returnedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            returns
        });
    } catch (error) {
        console.error("Get my return history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Admin view of full customer history across credits, payments, sales, and returns
export const getCustomerHistory = async (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = await Customer.findById(customerId).populate(
            "userId",
            "name username email phone role isActive createdAt updatedAt"
        ).lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const [credits, payments, sales, returns] = await Promise.all([
            Credit.find({ customerId }).sort({ createdAt: -1 }).lean(),
            Payment.find({ customerId })
                .populate("verifiedBy", "name email role")
                .populate("recordedBy", "name email role")
                .sort({ paidAt: -1 })
                .lean(),
            Sale.find({ customerId })
                .populate("adminId", "name email role")
                .populate("creditId")
                .sort({ createdAt: -1 })
                .lean(),
            Return.find({ customerId })
                .populate("saleId")
                .populate("adminId", "name email role")
                .sort({ returnedAt: -1 })
                .lean()
        ]);

        const syncResult = await syncCustomerTrustAndLimits(customerId);
        const latestCustomer = syncResult ? syncResult.customer : customer;
        const calculated = syncResult ? syncResult.calculated : calculateCustomerTrustScoreAndLimits({
            totalPurchase: latestCustomer.totalPurchase,
            sales,
            credits,
            payments
        });

        const autoLimit = Number(latestCustomer.maxBorrowAmount || 0);
        const manualLimit = Number(latestCustomer.manualBorrowLimit || 0);
        const effectiveLimit = manualLimit > 0 ? manualLimit : autoLimit;
        const isManualOverride = manualLimit > 0;

        return res.status(200).json({
            success: true,
            customer: latestCustomer,
            trustScore: latestCustomer.trustScore,
            trustTier: calculated.trustTier,
            trustBreakdown: calculated.breakdown,
            financialSummary: {
                totalPurchase: latestCustomer.totalPurchase,
                pendingAmount: latestCustomer.pendingAmount,
                autoCreditLimit: autoLimit,
                manualBorrowLimit: manualLimit,
                maxBorrowAmount: autoLimit,
                effectiveBorrowLimit: effectiveLimit,
                isManualOverride
            },
            history: {
                credits,
                payments,
                sales,
                returns
            }
        });
    } catch (error) {
        console.error("Get customer history error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update customer credit limit configuration (toggle auto vs manual, set manual limit)
export const updateBorrowLimit = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { creditLimitMode, manualBorrowLimit } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (creditLimitMode !== undefined) {
            if (!["auto", "manual"].includes(creditLimitMode)) {
                return res.status(400).json({
                    success: false,
                    message: "creditLimitMode must be either 'auto' or 'manual'"
                });
            }
            customer.creditLimitMode = creditLimitMode;
        }

        if (manualBorrowLimit !== undefined) {
            const limit = Number(manualBorrowLimit);
            if (!Number.isFinite(limit) || limit < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Manual borrow limit must be a valid non-negative number"
                });
            }
            customer.manualBorrowLimit = limit;
        }

        await customer.save();

        const syncResult = await syncCustomerTrustAndLimits(customerId);
        const latestCustomer = syncResult ? syncResult.customer : customer;

        const activeMode = latestCustomer.creditLimitMode || "auto";
        const autoLimit = Number(latestCustomer.maxBorrowAmount || 0);
        const manualLimit = Number(latestCustomer.manualBorrowLimit || 0);
        const effectiveLimit = activeMode === "manual" ? manualLimit : autoLimit;

        // Fetch user details for clean activity log
        const customerUser = await User.findById(latestCustomer.userId).select("name phone username");
        const customerName = customerUser?.name || "Customer";

        logAdminActivity({
            admin: req.user,
            req,
            action: "Updated Credit Limit",
            category: "Credit",
            targetId: customer._id,
            targetName: customerName,
            detail: activeMode === "manual"
                ? `Switched to Manual Limit Mode (₹${manualLimit.toLocaleString("en-IN")}) for customer ${customerName}`
                : `Switched to Automatic Limit Mode (Active: ₹${autoLimit.toLocaleString("en-IN")}) for customer ${customerName}`
        });

        return res.status(200).json({
            success: true,
            message: activeMode === "manual"
                ? `Switched to Manual Limit Mode (Active: ₹${manualLimit.toLocaleString("en-IN")})`
                : `Switched to Automatic Limit Mode (Active: ₹${autoLimit.toLocaleString("en-IN")})`,
            customer: latestCustomer,
            creditLimitMode: activeMode,
            autoCreditLimit: autoLimit,
            manualBorrowLimit: manualLimit,
            effectiveBorrowLimit: effectiveLimit,
            calculated: syncResult?.calculated
        });
    } catch (error) {
        console.error("Update borrow limit error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Recalculate customer Trust Score and Auto Credit Limit on demand
export const recalculateCustomerTrust = async (req, res) => {
    try {
        const { customerId } = req.params;
        const result = await syncCustomerTrustAndLimits(customerId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const customerUser = await User.findById(result.customer.userId).select("name phone username");
        const customerName = customerUser?.name || "Customer";

        logAdminActivity({
            admin: req.user,
            req,
            action: "Recalculated Trust Score",
            category: "Credit",
            targetId: customerId,
            targetName: customerName,
            detail: `Recalculated trust score to ${result.calculated.trustScore}/100 (${result.calculated.trustTier}) for customer ${customerName}`
        });

        return res.status(200).json({
            success: true,
            message: `Trust Score updated to ${result.calculated.trustScore}/100 (Tier: ${result.calculated.trustTier})`,
            customer: result.customer,
            calculated: result.calculated
        });
    } catch (error) {
        console.error("Recalculate customer trust error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};