import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import { authStorage } from "./services/api";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Credits from "./pages/Credits";
import Returns from "./pages/Returns";
import Transactions from "./pages/Transactions";
import Admins from "./pages/Admins";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import AboutSmartShop from "./pages/AboutSmartShop";
import About from "./pages/About";
import AddProduct from "./pages/AddProduct";
import AdminActivity from "./pages/AdminActivity";
import EditProduct from "./pages/EditProduct";
import CustomerProfile from "./pages/CustomerProfile";
import Categories from "./pages/Categories";
import ProductRequests from "./pages/ProductRequests";

const App = () => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("smartshop_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem("smartshop_admin_sidebar_collapsed", sidebarCollapsed);
    } catch (e) {
      console.error(e);
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const syncUser = () => {
      setUser(authStorage.getUser());
    };

    syncUser();
    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [location.pathname]);

  // Automatically close mobile sidebar drawer on route navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isLoginPage = location.pathname === "/login";

  return (
    <div
      className={`flex ${
        !user || isLoginPage ? "min-h-screen" : "h-screen"
      } w-full overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-[var(--app-accent)] selection:text-white`}
    >
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
        theme="dark"
      />

      {/* Render Sidebar only for authenticated admin views */}
      {user && !isLoginPage && (
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
          user={user}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden bg-zinc-950">
        {user && !isLoginPage && (
          <Navbar
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            isCollapsed={sidebarCollapsed}
          />
        )}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          <main
            className={`flex-1 ${
              !user || isLoginPage ? "" : "px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px]"
            } w-full mx-auto`}
          >
            <Routes>
            {/* Public authentication */}
            <Route path="/login" element={<Login />} />

            {/* Protected admin routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/add"
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-requests"
            element={
              <ProtectedRoute>
                <ProductRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <Returns />
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
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help-support"
            element={
              <ProtectedRoute>
                <HelpSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about-smartshop"
            element={
              <ProtectedRoute>
                <AboutSmartShop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutSmartShop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about-developer"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />
          <Route
            path="/developer"
            element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            }
          />

          {/* Superadmin specific routes */}
          <Route
            path="/admins"
            element={
              <SuperAdminRoute>
                <Admins />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/admin-activity"
            element={
              <SuperAdminRoute>
                <AdminActivity />
              </SuperAdminRoute>
            }
          />

          {/* Fallback navigation redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </div>
</div>
);
};

export default App;