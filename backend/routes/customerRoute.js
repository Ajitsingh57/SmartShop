import express from "express";
import {
    getMyProfile,
    updateMyProfile,
    getCustomerById,
    getAllCustomers,
    getMyCreditHistory,
    getMyPaymentHistory,
    getMySaleHistory,
    getMyReturnHistory,
    getCustomerHistory,
    updateBorrowLimit,
    recalculateCustomerTrust
} from "../controllers/customerController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin, customerOnly } from "../middleware/roleMiddleware.js";

const customerRouter = express.Router();

// Customer profile and history
customerRouter.get("/my-profile", authMiddleware, customerOnly, getMyProfile);
customerRouter.patch("/my-profile", authMiddleware, customerOnly, updateMyProfile);
customerRouter.get("/my-credits", authMiddleware, customerOnly, getMyCreditHistory);
customerRouter.get("/my-payments", authMiddleware, customerOnly, getMyPaymentHistory);
customerRouter.get("/my-sales", authMiddleware, customerOnly, getMySaleHistory);
customerRouter.get("/my-returns", authMiddleware, customerOnly, getMyReturnHistory);

// Admin customer management
customerRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllCustomers);
customerRouter.get("/:customerId", authMiddleware, adminOrSuperAdmin, getCustomerById);
customerRouter.get("/:customerId/history", authMiddleware, adminOrSuperAdmin, getCustomerHistory);
customerRouter.patch("/:customerId/borrow-limit", authMiddleware, adminOrSuperAdmin, updateBorrowLimit);
customerRouter.post("/:customerId/recalculate-trust", authMiddleware, adminOrSuperAdmin, recalculateCustomerTrust);

export default customerRouter;