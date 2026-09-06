import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import { authStorage } from "./services/api";

// Lazy-loaded admin pages for on-demand bundle splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Products = lazy(() => import("./pages/Products"));
const Sales = lazy(() => import("./pages/Sales"));
const Payments = lazy(() => import("./pages/Payments"));
const Credits = lazy(() => import("./pages/Credits"));
const Returns = lazy(() => import("./pages/Returns"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Admins = lazy(() => import("./pages/Admins"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const AboutSmartShop = lazy(() => import("./pages/AboutSmartShop"));
const About = lazy(() => import("./pages/About"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const AdminActivity = lazy(() => import("./pages/AdminActivity"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const Categories = lazy(() => import("./pages/Categories"));
const ProductRequests = lazy(() => import("./pages/ProductRequests"));

// Admin page fallback spinner
function AdminPageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="relative flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
        <span className="text-xs font-medium tracking-wider text-zinc-400">Loading module...</span>
      </div>
    </div>
  );
}

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
            <Suspense fallback={<AdminPageLoader />}>
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
      </Suspense>
    </main>
    <Footer />
    </div>
  </div>
</div>
);
};

export default App;