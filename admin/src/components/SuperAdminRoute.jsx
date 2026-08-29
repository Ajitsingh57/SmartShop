import React from "react";
import { Navigate } from "react-router-dom";
import { authStorage } from "../services/api";

// Route guard to restrict pages strictly to superadmin role
const SuperAdminRoute = ({ children }) => {
    const user = authStorage.getUser();

    if (!user || user.role !== "superadmin") {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return children;
};

export default SuperAdminRoute;