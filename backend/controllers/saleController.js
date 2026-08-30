import mongoose from "mongoose";
import Sale from "../models/saleModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import Credit from "../models/creditModel.js";
import { findCustomerByIdOrUser, runTransaction } from "../utils/helpers.js";
import { syncCustomerTrustAndLimits } from "../utils/trustScoreEngine.js";

// Record new sale with stock deduction and optional credit generation
export const createSale = async (req, res) => {
    try {
        const createdSale = await runTransaction(async (session) => {
            const {
                customerId = null,
                items = [],
                totalAmount,
                paymentType,
                paidAmount = 0,
                partialPaymentType = null
            } = req.body;

            if (totalAmount === undefined || totalAmount === null || totalAmount === "") {
                throw new Error("Total amount is required");
            }

            const amount = Number(totalAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                throw new Error("Total amount must be greater than 0");
            }

            const allowedPaymentTypes = ["cash", "upi", "credit", "partial"];
            if (!allowedPaymentTypes.includes(paymentType)) {
                throw new Error("Invalid payment type");
            }

            if (!Array.isArray(items)) {
                throw new Error("Items must be an array");
            }

            let finalPaidAmount = 0;
            let finalPendingAmount = 0;
            let finalPartialPaymentType = null;

            if (paymentType === "cash" || paymentType === "upi") {
                finalPaidAmount = amount;
                finalPendingAmount = 0;
            } else if (paymentType === "credit") {
                finalPaidAmount = 0;
                finalPendingAmount = amount;
            } else if (paymentType === "partial") {
                const paid = Number(paidAmount);
                if (!Number.isFinite(paid) || paid <= 0) {
                    throw new Error("Paid amount is required for partial payment");
                }
                if (paid >= amount) {
                    throw new Error("Partial payment must be less than total amount");
                }
                if (!["cash", "upi"].includes(partialPaymentType)) {
                    throw new Error("Partial payment method must be cash or upi");
                }

                finalPaidAmount = paid;
                finalPendingAmount = amount - paid;
                finalPartialPaymentType = partialPaymentType;
            }

            let customer = null;
            if (customerId) {
                customer = await findCustomerByIdOrUser(customerId, session);
                if (!customer) {
                    throw new Error("Customer not found");
                }
            }

            if ((paymentType === "credit" || paymentType === "partial") && !customer) {
                throw new Error("Customer is required for credit or partial payment");
            }

            const processedItems = [];

            for (const item of items) {
                // Handling unrecorded custom item
                if (!item.productId) {
                    const q =
                        item.quantity === "" || item.quantity === undefined || item.quantity === null
                            ? null
                            : Number(item.quantity);
                    let p =
                        item.price === "" || item.price === undefined || item.price === null
                            ? null
                            : Number(item.price);
                    let t =
                        item.total === "" || item.total === undefined || item.total === null
                            ? null
                            : Number(item.total);

                    if (t === null && Number.isFinite(p) && Number.isFinite(q)) {
                        t = p * q;
                    } else if (p === null && Number.isFinite(t) && (!q || q === 1)) {
                        p = t;
                    }

                    processedItems.push({
                        productId: null,
                        productName:
                            typeof item.productName === "string" && item.productName.trim()
                                ? item.productName.trim()
                                : "Unrecorded item",
                        quantity: Number.isFinite(q) ? q : null,
                        unit: item.unit || null,
                        price: Number.isFinite(p) ? p : null,
                        total: Number.isFinite(t) ? t : null
                    });
                    continue;
                }

                // Handling cataloged product item with non-deleted check
                let prodQuery = Product.findOne({ _id: item.productId, deleted: false });
                if (session) prodQuery = prodQuery.session(session);
                const product = await prodQuery;

                if (!product) {
                    throw new Error(`Product not found or unavailable: ${item.productId}`);
                }

                if (product.available === false) {
                    throw new Error(`${product.name} is not available`);
                }

                const productName =
                    typeof item.productName === "string" && item.productName.trim()
                        ? item.productName.trim()
                        : product.name;

                const price =
                    item.price !== undefined && item.price !== null && item.price !== ""
                        ? Number(item.price)
                        : Number(product.price);

                if (!Number.isFinite(price) || price < 0) {
                    throw new Error(`Invalid price for product ${product.name}`);
                }

                const rawQuantity =
                    item.quantity === "" || item.quantity === undefined || item.quantity === null
                        ? null
                        : Number(item.quantity);

                let itemTotal = null;

                if (rawQuantity !== null) {
                    if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) {
                        throw new Error(`Invalid quantity for product ${product.name}`);
                    }

                    if (typeof product.stock === "number" && product.stock < rawQuantity) {
                        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
                    }

                    if (typeof product.stock === "number") {
                        product.stock -= rawQuantity;
                        if (product.stock <= 0) {
                            product.stock = 0;
                            product.available = false;
                        }
                        await product.save({ session });
                    }

                    itemTotal = rawQuantity * price;
                } else if (item.total !== undefined && item.total !== null && item.total !== "") {
                    const totalVal = Number(item.total);
                    if (!Number.isFinite(totalVal) || totalVal < 0) {
                        throw new Error(`Invalid total for product ${product.name}`);
                    }
                    itemTotal = totalVal;
                }

                processedItems.push({
                    productId: product._id,
                    productName,
                    quantity: rawQuantity,
                    unit: item.unit || product.unit || null,
                    price,
                    total: itemTotal
                });
            }

            let creditDoc = null;

            if (paymentType === "credit" || paymentType === "partial") {
                const currentPending = Number(customer.pendingAmount || 0);
                const limitMode = customer.creditLimitMode || (customer.manualBorrowLimit > 0 ? "manual" : "auto");
                const maxLimit = limitMode === "manual"
                    ? Number(customer.manualBorrowLimit || 0)
                    : Number(customer.maxBorrowAmount || 0);

                if (maxLimit > 0 && currentPending + finalPendingAmount > maxLimit) {
                    throw new Error(`Credit limit exceeded. Customer is on ${limitMode.toUpperCase()} limit (Max: ₹${maxLimit.toLocaleString("en-IN")}, Available: ₹${Math.max(0, maxLimit - currentPending).toLocaleString("en-IN")})`);
                }

                const defaultDueDate = new Date();
                defaultDueDate.setDate(defaultDueDate.getDate() + 30);

                const newCredit = new Credit({
                    customerId: customer._id,
                    userId: customer.userId,
                    borrowedAmount: finalPendingAmount,
                    paidAmount: 0,
                    pendingAmount: finalPendingAmount,
                    borrowDate: new Date(),
                    dueDate: defaultDueDate,
                    extensionCount: 0,
                    status: "active"
                });

                creditDoc = await newCredit.save({ session });

                customer.pendingAmount = currentPending + finalPendingAmount;
            }

            if (customer) {
                customer.totalPurchase = Number(customer.totalPurchase || 0) + amount;
                await customer.save({ session });
            }

            const sale = new Sale({
                customerId: customer ? customer._id : null,
                adminId: req.user._id,
                items: processedItems,
                totalAmount: amount,
                paymentType,
                paidAmount: finalPaidAmount,
                pendingAmount: finalPendingAmount,
                partialPaymentType: finalPartialPaymentType,
                creditId: creditDoc ? creditDoc._id : null,
                status: "completed"
            });

            const savedSale = await sale.save({ session });

            if (creditDoc) {
                creditDoc.saleId = savedSale._id;
                await creditDoc.save({ session });
            }

            return savedSale;
        });

        const populatedSale = await Sale.findById(createdSale._id)
            .populate("customerId")
            .populate("adminId", "name email role")
            .populate("creditId");

        if (populatedSale?.customerId?._id || populatedSale?.customerId) {
            syncCustomerTrustAndLimits(populatedSale.customerId._id || populatedSale.customerId).catch((err) => {
                console.warn("Background customer trust sync error:", err);
            });
        }

        return res.status(201).json({
            success: true,
            message: "Sale recorded successfully",
            sale: populatedSale
        });

    } catch (error) {
        console.error("Create sale error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create sale"
        });
    }
};

// Fetch sales list for authenticated customer
export const getMySales = async (req, res) => {
    try {
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

        const sales = await Sale.find({ customerId: customer._id })
            .populate({
                path: "customerId",
                populate: {
                    path: "userId",
                    select: "name email phone username role"
                }
            })
            .populate("adminId", "name email role")
            .populate("creditId")
            .populate("items.productId", "name price category unit image")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            sales
        });
    } catch (error) {
        console.error("Get my sales error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch sales list for specific customer
export const getCustomerSales = async (req, res) => {
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

        const sales = await Sale.find({ customerId: customer._id })
            .populate({
                path: "customerId",
                populate: {
                    path: "userId",
                    select: "name email phone username role"
                }
            })
            .populate("adminId", "name email role")
            .populate("creditId")
            .populate("items.productId", "name price category unit image")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            sales
        });
    } catch (error) {
        console.error("Get customer sales error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch all sales across store
export const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate({
                path: "customerId",
                populate: {
                    path: "userId",
                    select: "name email phone username role"
                }
            })
            .populate("adminId", "name email role")
            .populate("creditId")
            .populate("items.productId", "name price category unit image")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            sales
        });
    } catch (error) {
        console.error("Get all sales error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Fetch sale details by id
export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id)
            .populate({
                path: "customerId",
                populate: {
                    path: "userId",
                    select: "name email phone username role"
                }
            })
            .populate("adminId", "name email role")
            .populate("creditId")
            .populate("items.productId", "name price category unit image");

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        if (req.user.role === "customer") {
            if (!sale.customerId || !sale.customerId.userId || sale.customerId.userId._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot access this sale"
                });
            }
        }

        return res.status(200).json({
            success: true,
            sale
        });
    } catch (error) {
        console.error("Get sale by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update sale status (e.g. cancelled, partially_returned, returned)
export const updateSaleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["completed", "partially_returned", "returned", "cancelled"];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed: completed, partially_returned, returned, cancelled"
            });
        }

        const sale = await Sale.findById(id);
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        sale.status = status;
        await sale.save();

        return res.status(200).json({
            success: true,
            message: "Sale status updated successfully",
            sale
        });
    } catch (error) {
        console.error("Update sale status error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};