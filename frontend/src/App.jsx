import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import About from "./pages/About";
import AboutSmartShop from "./pages/AboutSmartShop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ForgotPassword from "./pages/ForgotPassword";

import Payments from "./pages/Payments";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Navbar />
      <main className="flex-1 pt-8">
        <Routes>
          {/* Public customer routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Settings and information routes */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/help-support" element={<HelpSupport />} />
          <Route path="/about" element={<About />} />
          <Route path="/about-smartshop" element={<AboutSmartShop />} />

          {/* Protected customer routes requiring authentication */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}