import express from "express";
import {
    createCredit,
    getMyCredits,
    getCreditById,
    getCustomerCredits,
    getAllCredits,
    extendDueDate,
    updateOverdueStatus
} from "../controllers/creditController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin, customerOnly } from "../middleware/roleMiddleware.js";

const creditRouter = express.Router();

// Customer credit routes
creditRouter.get("/my", authMiddleware, customerOnly, getMyCredits);

// Admin credit management routes
creditRouter.post("/", authMiddleware, adminOrSuperAdmin, createCredit);
creditRouter.get("/customer/:customerId", authMiddleware, adminOrSuperAdmin, getCustomerCredits);
creditRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllCredits);
creditRouter.patch("/:id/extend", authMiddleware, adminOrSuperAdmin, extendDueDate);
creditRouter.patch("/:id/status", authMiddleware, adminOrSuperAdmin, updateOverdueStatus);

// Single credit lookup
creditRouter.get("/:id", authMiddleware, getCreditById);

export default creditRouter;