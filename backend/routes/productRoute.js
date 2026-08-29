import express from "express";
import {
    addProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from "../controllers/productController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const productRouter = express.Router();

// Public product endpoints
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);

// Admin product management
productRouter.post("/", authMiddleware, adminOrSuperAdmin, upload.single("image"), addProduct);
productRouter.put("/:id", authMiddleware, adminOrSuperAdmin, upload.single("image"), updateProduct);
productRouter.delete("/:id", authMiddleware, adminOrSuperAdmin, deleteProduct);

export default productRouter;