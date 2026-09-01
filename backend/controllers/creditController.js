import mongoose from "mongoose";
import Credit from "../models/creditModel.js";
import Customer from "../models/customerModel.js";
import { findCustomerByIdOrUser, runTransaction } from "../utils/helpers.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";

// Create new customer credit
export async function createCredit(req, res) {
    try {
        const { customerId, borrowedAmount, dueDate } = req.body;

        if (!customerId || borrowedAmount === undefined || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Customer, borrowed amount and due date are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        const amount = Number(borrowedAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Borrowed amount must be greater than 0"
            });
        }

        const due = new Date(dueDate);
        if (isNaN(due.getTime()) || due <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Due date must be a valid future date"
            });
        }

        const credit = await runTransaction(async (session) => {
            const customer = await findCustomerByIdOrUser(customerId, session);

            if (!customer) {
                const err = new Error("Customer not found");
                err.status = 404;
                throw err;
            }

            if (!customer.userId) {
                const err = new Error("Customer is not linked with a user account");
                err.status = 400;
                throw err;
            }

            const newCredit = new Credit({
                customerId: customer._id,
                userId: customer.userId,
                borrowedAmount: amount,
                paidAmount: 0,
                pendingAmount: amount,
                borrowDate: new Date(),
                dueDate: due,
                extensionCount: 0,
                status: "active"
            });

            await newCredit.save({ session });

            if (session) {
                await Customer.findByIdAndUpdate(
                    customer._id,
                    { $inc: { pendingAmount: amount } },
                    { session }
                );
            } else {
                customer.pendingAmount = Number(customer.pendingAmount || 0) + amount;
                await customer.save();
            }

            return newCredit;
        });

        // Sync customer metrics in background
        if (credit.customerId) {
            syncCustomerTrustAndLimits(credit.customerId).catch((err) => {
                console.warn("Background trust sync error on credit create:", err);
            });
        }

        // log credit creation activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Created Credit",
            category: "Credit",
            targetId: credit._id,
            detail: `Issued credit of ₹${amount.toLocaleString("en-IN")} with due date ${due.toLocaleDateString("en-IN")}`
        });

        return res.status(201).json({
            success: true,
            message: "Credit created successfully",
            credit
        });
    } catch (err) {
        console.error("Create credit error:", err);
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || "Server Error"
        });
    }
}

// Get logged-in customer's credit records
export async function getMyCredits(req, res) {
    try {
        const userId = req.user._id;
        const credits = await Credit.find({ userId })
            .populate("customerId", "userId pendingAmount totalPurchase trustScore")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            credits
        });
    } catch (err) {
        console.error("Get my credits error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Get single credit by id
export async function getCreditById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid credit ID"
            });
        }

        const credit = await Credit.findById(id)
            .populate("customerId")
            .populate("userId", "name email phone role");

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: "Credit record not found"
            });
        }

        // Restrict customers to only their own records
        if (req.user.role === "customer") {
            if (!credit.userId || credit.userId._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot access this credit"
                });
            }
        }

        return res.status(200).json({
            success: true,
            credit
        });
    } catch (err) {
        console.error("Get credit error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Get all credits for a specific customer
export async function getCustomerCredits(req, res) {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }

        let customer = await Customer.findById(customerId);
        if (!customer) {
            customer = await Customer.findOne({ userId: customerId });
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const credits = await Credit.find({ customerId: customer._id })
            .populate("userId", "name email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            credits
        });
    } catch (err) {
        console.error("Get customer credits error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Get all system credits
export async function getAllCredits(req, res) {
    try {
        const credits = await Credit.find()
            .populate("customerId")
            .populate("userId", "name email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            credits
        });
    } catch (err) {
        console.error("Get all credits error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Extend due date for a credit (one-time allowed)
export async function extendDueDate(req, res) {
    try {
        const { id } = req.params;
        const { newDueDate, reason } = req.body;

        if (!newDueDate || !reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "New due date and reason are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid credit ID"
            });
        }

        const credit = await Credit.findById(id);
        if (!credit) {
            return res.status(404).json({
                success: false,
                message: "Credit record not found"
            });
        }

        if (credit.extensionCount >= 1) {
            return res.status(400).json({
                success: false,
                message: "Due date extension has already been used for this credit"
            });
        }

        if (credit.status === "paid" || Number(credit.pendingAmount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Paid credit cannot be extended"
            });
        }

        let newDue = null;
        if (typeof newDueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(newDueDate.trim())) {
            const [y, m, d] = newDueDate.trim().split("-").map(Number);
            newDue = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            newDue = new Date(newDueDate);
        }

        if (!newDue || isNaN(newDue.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid new due date format"
            });
        }

        const currentDue = new Date(credit.dueDate);
        if (newDue <= currentDue) {
            return res.status(400).json({
                success: false,
                message: `New due date must be after current due date (${currentDue.toLocaleDateString("en-IN")})`
            });
        }

        const oldDueDate = credit.dueDate;
        credit.extensionCount = 1;
        credit.extension = {
            oldDueDate,
            newDueDate: newDue,
            reason: reason.trim(),
            extendedAt: new Date(),
            extendedBy: req.user._id
        };
        credit.dueDate = newDue;

        if (Number(credit.pendingAmount) <= 0) {
            credit.status = "paid";
        } else if (Number(credit.paidAmount) > 0) {
            credit.status = "partially_paid";
        } else {
            credit.status = "active";
        }

        await credit.save();

        // Sync customer trust metrics after due date extension
        if (credit.customerId) {
            syncCustomerTrustAndLimits(credit.customerId).catch((err) => {
                console.warn("Background trust sync error on extend due date:", err);
            });
        }

        // log credit extension activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Extended Due Date",
            category: "Credit",
            targetId: credit._id,
            detail: `Extended credit due date to ${newDue.toLocaleDateString("en-IN")} (Reason: ${reason.trim()})`
        });

        return res.status(200).json({
            success: true,
            message: "Due date extended successfully",
            credit
        });
    } catch (err) {
        console.error("Extend due date error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Recalculate and update credit status
export async function updateOverdueStatus(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid credit ID"
            });
        }

        const credit = await Credit.findById(id);
        if (!credit) {
            return res.status(404).json({
                success: false,
                message: "Credit record not found"
            });
        }

        if (Number(credit.pendingAmount) <= 0) {
            credit.pendingAmount = 0;
            credit.status = "paid";
        } else if (new Date() > new Date(credit.dueDate)) {
            credit.status = "overdue";
        } else if (Number(credit.paidAmount) > 0) {
            credit.status = "partially_paid";
        } else {
            credit.status = "active";
        }

        await credit.save();

        return res.status(200).json({
            success: true,
            message: "Credit status updated",
            credit
        });
    } catch (err) {
        console.error("Update overdue status error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}