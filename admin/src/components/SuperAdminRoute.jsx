import React from "react";
import { Navigate } from "react-router-dom";
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

// Route guard to restrict pages strictly to superadmin role
const SuperAdminRoute = ({ children }) => {
  const token = authStorage.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = authStorage.getUser();
  let role = (user?.role || "").toLowerCase().trim();

  if (!role) {
    const jwtPayload = parseJwt(token);
    if (jwtPayload?.role) {
      role = String(jwtPayload.role).toLowerCase().trim();
    }
  }

  if (role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default SuperAdminRoute;