import express from "express";
import {
  createProductRequest,
  getMyProductRequests,
  getAllProductRequests,
  updateProductRequestStatus,
  deleteProductRequest,
} from "../controllers/productRequestController.js";
import authMiddleware from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { adminOrSuperAdmin } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const productRequestRouter = express.Router();

// Customer endpoints
productRequestRouter.post(
  "/",
  optionalAuth,
  upload.single("image"),
  createProductRequest
);
productRequestRouter.get("/my", authMiddleware, getMyProductRequests);

// Admin endpoints
productRequestRouter.get("/", authMiddleware, adminOrSuperAdmin, getAllProductRequests);
productRequestRouter.patch(
  "/:id/status",
  authMiddleware,
  adminOrSuperAdmin,
  updateProductRequestStatus
);
productRequestRouter.delete(
  "/:id",
  authMiddleware,
  adminOrSuperAdmin,
  deleteProductRequest
);

export default productRequestRouter;
