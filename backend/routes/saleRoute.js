import express from "express";
import {
    createSale,
    getMySales,
    getSaleById,
    getCustomerSales,
    getAllSales,
    updateSaleStatus
} from "../controllers/saleController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin, customerOnly } from "../middleware/roleMiddleware.js";

const saleRouter = express.Router();

// Record new sale
saleRouter.post("/", authMiddleware, adminOrSuperAdmin, createSale);

// Customer sales history
saleRouter.get("/my", authMiddleware, customerOnly, getMySales);

// Admin sales queries
saleRouter.get("/customer/:customerId", authMiddleware, adminOrSuperAdmin, getCustomerSales);
saleRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllSales);
saleRouter.get("/:id", authMiddleware, getSaleById);
saleRouter.patch("/:id/status", authMiddleware, adminOrSuperAdmin, updateSaleStatus);

export default saleRouter;