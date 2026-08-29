import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "../services/api";

const parseJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Route guard to ensure user is logged in as an admin or superadmin
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const token = authStorage.getToken();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = authStorage.getUser();
  let role = (user?.role || "").toLowerCase().trim();

  // If role is missing from user object, extract directly from JWT token payload
  if (!role) {
    const jwtPayload = parseJwt(token);
    if (jwtPayload?.role) {
      role = String(jwtPayload.role).toLowerCase().trim();
    }
  }

  // If role is specifically customer, prompt admin login
  if (role === "customer") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Admin or superadmin has full access
  return children;
};

export default ProtectedRoute;