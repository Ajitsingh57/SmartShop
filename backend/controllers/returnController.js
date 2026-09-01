import mongoose from "mongoose";
import Sale from "../models/saleModel.js";
import Return from "../models/returnModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import Credit from "../models/creditModel.js";
import { logAdminActivity } from "../utils/activityLogger.js";

// Process sale returns with inventory replenishment and credit/refund handling
export const createReturn = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        let createdReturn = null;
        let finalSaleStatus = null;

        await session.withTransaction(async () => {
            const {
                saleId,
                items = [],
                refundMethod,
                reason = "",
                transactionId = null
            } = req.body;

            if (!saleId) {
                throw new Error("Sale ID is required");
            }

            const sale = await Sale.findById(saleId).session(session);
            if (!sale) {
                throw new Error("Sale not found");
            }

            if (sale.status === "cancelled") {
                throw new Error("Cancelled sale cannot be returned");
            }

            if (sale.status === "returned") {
                throw new Error("This sale has already been fully returned");
            }

            if (!Array.isArray(items) || items.length === 0) {
                throw new Error("At least one item is required for return");
            }

            const allowedRefundMethods = ["cash", "upi", "credit_adjustment"];
            if (!allowedRefundMethods.includes(refundMethod)) {
                throw new Error("Invalid refund method");
            }

            let customer = null;
            if (sale.customerId) {
                customer = await Customer.findById(sale.customerId).session(session);
                if (!customer) {
                    customer = await Customer.findOne({ userId: sale.customerId }).session(session);
                }
            }

            let credit = null;
            if (sale.creditId) {
                credit = await Credit.findById(sale.creditId).session(session);
            }

            if (refundMethod === "credit_adjustment") {
                if (!credit && customer) {
                    credit = await Credit.findOne({
                        $or: [{ customerId: customer._id }, { userId: customer.userId }],
                        pendingAmount: { $gt: 0 }
                    }).sort({ createdAt: -1 }).session(session);
                }

                if (!credit && (!customer || Number(customer.pendingAmount || 0) <= 0)) {
                    throw new Error("No active credit balance found for this customer to adjust");
                }
            }

            const previousReturns = await Return.find({ saleId: sale._id }).session(session);
            const returnedQuantities = {};

            for (const oldReturn of previousReturns) {
                for (const oldItem of oldReturn.items) {
                    if (!oldItem.productId) continue;
                    const productId = oldItem.productId.toString();
                    returnedQuantities[productId] =
                        (returnedQuantities[productId] || 0) + Number(oldItem.quantity || 0);
                }
            }

            const processedItems = [];
            let returnAmount = 0;

            for (const returnItem of items) {
                // Handling unrecorded custom item
                if (!returnItem.productId) {
                    const amount = Number(returnItem.total);
                    if (!Number.isFinite(amount) || amount <= 0) {
                        throw new Error("Valid total is required for unrecorded returned item");
                    }

                    processedItems.push({
                        productId: null,
                        productName: returnItem.productName?.trim() || "Unrecorded item",
                        quantity: returnItem.quantity ?? null,
                        unit: returnItem.unit ?? null,
                        price: returnItem.price ?? null,
                        total: amount
                    });

                    returnAmount += amount;
                    continue;
                }

                // Handling cataloged product return
                const productId = returnItem.productId.toString();
                const soldItem = sale.items.find(
                    item => item.productId && item.productId.toString() === productId
                );

                if (!soldItem) {
                    throw new Error("This product was not part of the original sale");
                }

                if (soldItem.quantity === null || soldItem.quantity === undefined) {
                    throw new Error(`Return quantity cannot be verified for ${soldItem.productName}`);
                }

                const soldQuantity = Number(soldItem.quantity);
                const alreadyReturned = returnedQuantities[productId] || 0;
                const remainingQuantity = soldQuantity - alreadyReturned;
                const returnQuantity = Number(returnItem.quantity);

                if (!Number.isFinite(returnQuantity) || returnQuantity <= 0) {
                    throw new Error(`Invalid return quantity for ${soldItem.productName}`);
                }

                const currentRequestQuantity = processedItems
                    .filter(item => item.productId && item.productId.toString() === productId)
                    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

                if (currentRequestQuantity + returnQuantity > remainingQuantity) {
                    throw new Error(
                        `Cannot return more than ${remainingQuantity} ${soldItem.unit || ""} of ${soldItem.productName}`
                    );
                }

                if (returnItem.unit && soldItem.unit && returnItem.unit !== soldItem.unit) {
                    throw new Error(`Return unit must match original sale unit for ${soldItem.productName}`);
                }

                let itemTotal;
                if (returnItem.total !== undefined && returnItem.total !== null) {
                    itemTotal = Number(returnItem.total);
                } else if (soldItem.price !== null && soldItem.price !== undefined) {
                    itemTotal = returnQuantity * Number(soldItem.price);
                } else {
                    throw new Error(`Return amount is required for ${soldItem.productName}`);
                }

                if (!Number.isFinite(itemTotal) || itemTotal <= 0) {
                    throw new Error(`Invalid return amount for ${soldItem.productName}`);
                }

                if (soldItem.price !== null && soldItem.price !== undefined) {
                    const maximumAmount = returnQuantity * Number(soldItem.price);
                    if (itemTotal > maximumAmount) {
                        throw new Error(
                            `Return amount is greater than original sale value for ${soldItem.productName}`
                        );
                    }
                }

                processedItems.push({
                    productId: soldItem.productId,
                    productName: soldItem.productName,
                    quantity: returnQuantity,
                    unit: soldItem.unit ?? returnItem.unit ?? null,
                    price: soldItem.price ?? returnItem.price ?? null,
                    total: itemTotal
                });

                returnAmount += itemTotal;
            }

            if (!Number.isFinite(returnAmount) || returnAmount <= 0) {
                throw new Error("Invalid return amount");
            }

            const previousReturnAmount = previousReturns.reduce(
                (sum, oldReturn) => sum + Number(oldReturn.returnAmount || 0),
                0
            );

            const remainingSaleAmount = Number(sale.totalAmount) - previousReturnAmount;
            if (returnAmount > remainingSaleAmount) {
                throw new Error(`Return amount cannot exceed remaining sale amount of ${remainingSaleAmount}`);
            }

            // Restock returned inventory
            for (const item of processedItems) {
                if (!item.productId || item.quantity === null || item.quantity === undefined) {
                    continue;
                }

                const product = await Product.findById(item.productId).session(session);
                if (!product) {
                    throw new Error(`Product not found: ${item.productName}`);
                }

                product.stock = Number(product.stock || 0) + Number(item.quantity);
                if (product.stock > 0) {
                    product.available = true;
                }
                await product.save({ session });
            }

            const returnRecord = new Return({
                saleId: sale._id,
                customerId: customer?._id || null,
                adminId: req.user._id,
                items: processedItems,
                returnAmount,
                refundMethod,
                refundStatus: "completed",
                transactionId: typeof transactionId === "string" ? transactionId.trim() || null : null,
                reason: typeof reason === "string" ? reason.trim() : "",
                returnedAt: new Date()
            });

            await returnRecord.save({ session });

            // Reduce customer pending credit debt if adjustment
            if (credit && refundMethod === "credit_adjustment") {
                credit.pendingAmount = Math.max(0, Number(credit.pendingAmount) - returnAmount);

                if (Number(credit.paidAmount || 0) > Number(credit.borrowedAmount || 0)) {
                    credit.paidAmount = Number(credit.borrowedAmount);
                }

                credit.status = credit.pendingAmount === 0 ? "paid" : "partially_paid";
                await credit.save({ session });
            }

            if (customer) {
                customer.totalPurchase = Math.max(0, Number(customer.totalPurchase || 0) - returnAmount);

                if (refundMethod === "credit_adjustment") {
                    customer.pendingAmount = Math.max(0, Number(customer.pendingAmount || 0) - returnAmount);
                }

                await customer.save({ session });
            }

            const totalReturned = previousReturnAmount + returnAmount;
            sale.status = totalReturned >= Number(sale.totalAmount) ? "returned" : "partially_returned";
            await sale.save({ session });

            createdReturn = returnRecord;
            finalSaleStatus = sale.status;
        });

        // log return processing activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Processed Return",
            category: "Return",
            targetId: createdReturn._id,
            detail: `Processed return of ₹${Number(createdReturn.returnAmount || 0).toLocaleString("en-IN")} (${createdReturn.refundMethod}) for sale #${createdReturn.saleId}`
        });

        return res.status(201).json({
            success: true,
            message:
                finalSaleStatus === "returned"
                    ? "Sale fully returned successfully"
                    : "Sale partially returned successfully",
            return: createdReturn,
            saleStatus: finalSaleStatus
        });
    } catch (error) {
        console.error("Create return transaction error:", error);

        const status400Messages = [
            "Sale ID is required",
            "Sale not found",
            "Cancelled sale cannot be returned",
            "This sale has already been fully returned",
            "At least one item is required for return",
            "Invalid refund method",
            "Credit record not found",
            "Credit adjustment is only available",
            "No active credit balance found",
            "Customer not found",
            "Valid total is required for unrecorded returned item",
            "This product was not part of the original sale",
            "Return quantity cannot be verified",
            "Invalid return quantity",
            "Cannot return more than",
            "Return unit must match",
            "Return amount is required",
            "Invalid return amount",
            "Return amount is greater than original sale value",
            "Return amount cannot exceed remaining sale amount",
            "Product not found"
        ];

        const isBusinessError = status400Messages.some(msg => error.message.includes(msg));
        if (isBusinessError) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    } finally {
        await session.endSession();
    }
};

// Fetch single return details by id
export const getReturnById = async (req, res) => {
    try {
        const { id } = req.params;
        const returnRecord = await Return.findById(id)
            .populate("saleId")
            .populate("customerId")
            .populate("adminId", "name email role");

        if (!returnRecord) {
            return res.status(404).json({
                success: false,
                message: "Return record not found"
            });
        }

        if (req.user.role === "customer") {
            if (!returnRecord.customerId || returnRecord.customerId.userId?.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot access this return"
                });
            }
        }

        return res.status(200).json({
            success: true,
            return: returnRecord
        });
    } catch (error) {
        console.error("Get return error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch logged-in customer's return list
export const getMyReturns = async (req, res) => {
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
        console.error("Get my returns error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch returns for a specific customer
export const getCustomerReturns = async (req, res) => {
    try {
        const { customerId } = req.params;
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

        const returns = await Return.find({ customerId: customer._id })
            .populate("saleId")
            .populate("adminId", "name email role")
            .sort({ returnedAt: -1 });

        return res.status(200).json({
            success: true,
            returns
        });
    } catch (error) {
        console.error("Get customer returns error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch all returns in the store
export const getAllReturns = async (req, res) => {
    try {
        const returns = await Return.find()
            .populate({
                path: "saleId",
                populate: {
                    path: "customerId",
                    populate: {
                        path: "userId",
                        select: "name username email phone"
                    }
                }
            })
            .populate({
                path: "customerId",
                populate: {
                    path: "userId",
                    select: "name username email phone"
                }
            })
            .populate("adminId", "name email role")
            .sort({ returnedAt: -1 });

        return res.status(200).json({
            success: true,
            returns
        });
    } catch (error) {
        console.error("Get all returns error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch return history for a specific sale
export const getSaleReturns = async (req, res) => {
    try {
        const { saleId } = req.params;
        const sale = await Sale.findById(saleId);

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        const returns = await Return.find({ saleId })
            .populate("customerId")
            .populate("adminId", "name email role")
            .sort({ returnedAt: -1 });

        return res.status(200).json({
            success: true,
            returns
        });
    } catch (error) {
        console.error("Get sale returns error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};