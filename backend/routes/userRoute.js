import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    customerOnly,
    superAdminOnly,
    adminOrSuperAdmin
} from "../middleware/roleMiddleware.js";
import {
    register,
    login,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
    getMyProfile,
    updateMyProfile
} from "../controllers/userController.js";
import {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    updateAdminStatus,
    deleteAdmin,
    getAdminActivities,
    getMyAdminProfile,
    updateMyAdminProfile
} from "../controllers/adminController.js";
import {
    changePassword,
    forgotPassword,
    resetPassword
} from "../controllers/passwordController.js";

const userRouter = express.Router();

// Public auth routes
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

// Self profile routes
userRouter.get("/my-profile", authMiddleware, customerOnly, getMyProfile);
userRouter.put("/my-profile", authMiddleware, customerOnly, updateMyProfile);
userRouter.get("/admin-profile", authMiddleware, adminOrSuperAdmin, getMyAdminProfile);
userRouter.put("/admin-profile", authMiddleware, adminOrSuperAdmin, updateMyAdminProfile);
userRouter.post("/change-password", authMiddleware, changePassword);

// Customer management (Admin & Superadmin)
userRouter.get("/customers", authMiddleware, adminOrSuperAdmin, getAllCustomers);
userRouter.get("/customers/:id", authMiddleware, adminOrSuperAdmin, getCustomerById);
userRouter.put("/customers/:id", authMiddleware, adminOrSuperAdmin, updateCustomer);
userRouter.patch("/customers/:id", authMiddleware, adminOrSuperAdmin, updateCustomer);
userRouter.patch("/customers/:id/status", authMiddleware, adminOrSuperAdmin, updateCustomerStatus);
userRouter.delete("/customers/:id", authMiddleware, adminOrSuperAdmin, deleteCustomer);

// Admin management (Superadmin only)
userRouter.get("/admins", authMiddleware, superAdminOnly, getAllAdmins);
userRouter.get("/admins/:id", authMiddleware, superAdminOnly, getAdminById);
userRouter.post("/admins", authMiddleware, superAdminOnly, createAdmin);
userRouter.put("/admins/:id", authMiddleware, superAdminOnly, updateAdmin);
userRouter.patch("/admins/:id/status", authMiddleware, superAdminOnly, updateAdminStatus);
userRouter.delete("/admins/:id", authMiddleware, superAdminOnly, deleteAdmin);
userRouter.get("/admin-activity", authMiddleware, superAdminOnly, getAdminActivities);

export default userRouter;