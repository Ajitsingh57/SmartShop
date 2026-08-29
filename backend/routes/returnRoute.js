import express from "express";
import {
    createReturn,
    getMyReturns,
    getReturnById,
    getCustomerReturns,
    getAllReturns
} from "../controllers/returnController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin, customerOnly } from "../middleware/roleMiddleware.js";

const returnRouter = express.Router();

// Admin creates a return
returnRouter.post("/", authMiddleware, adminOrSuperAdmin, createReturn);

// Customer returns history
returnRouter.get("/my", authMiddleware, customerOnly, getMyReturns);

// Admin returns views
returnRouter.get("/customer/:customerId", authMiddleware, adminOrSuperAdmin, getCustomerReturns);
returnRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllReturns);
returnRouter.get("/:id", authMiddleware, getReturnById);

export default returnRouter;