import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage } from "../services/api";

// Protect routes that require customer authentication
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = authStorage.getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;