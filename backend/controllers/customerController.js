import Customer from "../models/customerModel.js";
import User from "../models/userModel.js";
import Credit from "../models/creditModel.js";
import Payment from "../models/paymentModel.js";
import Sale from "../models/saleModel.js";
import Return from "../models/returnModel.js";
import { calculateCustomerTrustScoreAndLimits, syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";

// Fetch customer profile for authenticated user
export const getMyProfile = async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user._id })
            .populate("userId", "name email phone role isActive");

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
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }
            user.name = trimmedName;
        }

        // Add email only if user didn't have one
        if (email !== undefined) {
            const trimmedEmail = String(email).trim().toLowerCase();
            if (!trimmedEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email cannot be empty"
                });
            }

            if (user.email) {
                if (trimmedEmail !== user.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Existing email cannot be changed"
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
                        message: "Email already exists"
                    });
                }
                user.email = trimmedEmail;
            }
        }

        // Add phone only if user didn't have one
        if (phone !== undefined) {
            const trimmedPhone = String(phone).trim();
            if (!trimmedPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot be empty"
                });
            }

            if (user.phone) {
                if (trimmedPhone !== user.phone) {
                    return res.status(400).json({
                        success: false,
                        message: "Existing phone number cannot be changed"
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
                        message: "Phone number already exists"
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
            .sort({ createdAt: -1 });

        const formattedCustomers = await Promise.all(
            customers.map(async (customer) => {
                const user = customer.userId;

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
                        credits: [],
                        sales: [],
                        returns: []
                    };
                }

                const credits = await Credit.find({ customerId: customer._id }).sort({ createdAt: -1 });
                const sales = await Sale.find({ customerId: customer._id }).sort({ createdAt: -1 });
                const returns = await Return.find({ customerId: customer._id }).sort({ createdAt: -1 });

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
            })
        );

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
        const customer = await Customer.findOne({ userId: req.user._id });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const credits = await Credit.find({ customerId: customer._id }).sort({ createdAt: -1 });

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
            .sort({ paidAt: -1 });

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
        const customer = await Customer.findOne({ userId: req.user._id });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const sales = await Sale.find({ customerId: customer._id })
            .populate("adminId", "name email role")
            .populate("creditId")
            .sort({ createdAt: -1 });

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
        const customer = await Customer.findOne({ userId: req.user._id });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const returns = await Return.find({ customerId: customer._id })
            .populate("saleId")
            .populate("adminId", "name email role")
            .sort({ returnedAt: -1 });

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
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const [credits, payments, sales, returns] = await Promise.all([
            Credit.find({ customerId }).sort({ createdAt: -1 }),
            Payment.find({ customerId })
                .populate("verifiedBy", "name email role")
                .populate("recordedBy", "name email role")
                .sort({ paidAt: -1 }),
            Sale.find({ customerId })
                .populate("adminId", "name email role")
                .populate("creditId")
                .sort({ createdAt: -1 }),
            Return.find({ customerId })
                .populate("saleId")
                .populate("adminId", "name email role")
                .sort({ returnedAt: -1 })
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