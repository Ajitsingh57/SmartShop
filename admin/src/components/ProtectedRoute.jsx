import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "../services/api";

// Route guard to ensure user is logged in as an admin or superadmin
const ProtectedRoute = ({ children }) => {
    const location = useLocation();

    const token = authStorage.getToken();
    const user = authStorage.getUser();

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
};

export default ProtectedRoute;