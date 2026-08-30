import express from "express";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/auth.js";
import { adminOrSuperAdmin } from "../middleware/roleMiddleware.js";

const categoryRouter = express.Router();

// Public endpoint to read categories (for store catalog & admin)
categoryRouter.get("/", getCategories);

// Admin-only endpoints for management
categoryRouter.post("/", authMiddleware, adminOrSuperAdmin, addCategory);
categoryRouter.put("/:id", authMiddleware, adminOrSuperAdmin, updateCategory);
categoryRouter.delete("/:id", authMiddleware, adminOrSuperAdmin, deleteCategory);

export default categoryRouter;
