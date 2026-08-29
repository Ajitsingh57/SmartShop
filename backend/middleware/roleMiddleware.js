// Middleware to restrict access by user role
export function allowRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        next();
    };
}

// Role-specific helpers
export function customerOnly(req, res, next) {
    return allowRoles("customer")(req, res, next);
}

export function superAdminOnly(req, res, next) {
    return allowRoles("superadmin")(req, res, next);
}

export function adminOrSuperAdmin(req, res, next) {
    return allowRoles("admin", "superadmin")(req, res, next);
}