import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminAuthToken") ||
      localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Standardize error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

// Authentication service endpoints
export const authApi = {
  register: async (userData) => {
    const response = await api.post("/users/register", userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post("/users/login", credentials);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.post("/users/change-password", passwordData);
    return response.data;
  },
  forgotPassword: async (data) => {
    const response = await api.post("/users/forgot-password", data);
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await api.post("/users/reset-password", data);
    return response.data;
  },
  updateMyProfile: async (data) => {
    const response = await api.put("/users/admin-profile", data);
    return response.data;
  },
};

// Admin management service endpoints (SuperAdmin)
export const adminsApi = {
  getAll: async () => {
    const response = await api.get("/users/admins");
    return response.data;
  },
  getMyProfile: async () => {
    const response = await api.get("/users/admin-profile");
    return response.data;
  },
  updateMyProfile: async (data) => {
    const response = await api.put("/users/admin-profile", data);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/users/admins/${id}`);
    return response.data;
  },
  create: async (adminData) => {
    const response = await api.post("/users/admins", adminData);
    return response.data;
  },
  update: async (id, adminData) => {
    const response = await api.put(`/users/admins/${id}`, adminData);
    return response.data;
  },
  updateStatus: async (id, isActive) => {
    const response = await api.patch(`/users/admins/${id}/status`, { isActive });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/admins/${id}`);
    return response.data;
  },
  getActivities: async () => {
    const response = await api.get("/users/admin-activity");
    return response.data;
  },
};

// Products service endpoints
export const productsApi = {
  list: async () => {
    const response = await api.get("/products");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  add: async (formData) => {
    const response = await api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  update: async (id, formData) => {
    const response = await api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Credits service endpoints
export const creditsApi = {
  getAll: async () => {
    const response = await api.get("/credits");
    return response.data;
  },
  getMyCredits: async () => {
    const response = await api.get("/credits/my");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/credits/${id}`);
    return response.data;
  },
  getCustomerCredits: async (customerId) => {
    const response = await api.get(`/credits/customer/${customerId}`);
    return response.data;
  },
  create: async (creditData) => {
    const response = await api.post("/credits", creditData);
    return response.data;
  },
  extendDueDate: async (id, data) => {
    const response = await api.patch(`/credits/${id}/extend`, data);
    return response.data;
  },
  updateOverdueStatus: async (id) => {
    const response = await api.patch(`/credits/${id}/status`);
    return response.data;
  },
};

// Payments service endpoints
export const paymentsApi = {
  getAll: async () => {
    const response = await api.get("/payments");
    return response.data;
  },
  getPending: async () => {
    const response = await api.get("/payments/pending");
    return response.data;
  },
  getMyPayments: async () => {
    const response = await api.get("/payments/my");
    return response.data;
  },
  getCustomerPayments: async (customerId) => {
    const response = await api.get(`/payments/customer/${customerId}`);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.patch(`/payments/${id}/approve`);
    return response.data;
  },
  reject: async (id) => {
    const response = await api.patch(`/payments/${id}/reject`);
    return response.data;
  },
  createClaim: async (paymentData) => {
    const response = await api.post("/payments/claim", paymentData);
    return response.data;
  },
  getSettings: async () => {
    const response = await api.get("/payments/settings");
    return response.data;
  },
  updateSettings: async (settingsData) => {
    const response = await api.patch("/payments/settings/razorpay", settingsData);
    return response.data;
  },
  createRazorpayOrder: async (data) => {
    const response = await api.post("/payments/razorpay/create-order", data);
    return response.data;
  },
  verifyRazorpayPayment: async (data) => {
    const response = await api.post("/payments/razorpay/verify", data);
    return response.data;
  },
};

// Returns service endpoints
export const returnsApi = {
  getAll: async () => {
    const response = await api.get("/returns");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/returns/${id}`);
    return response.data;
  },
  getCustomerReturns: async (customerId) => {
    const response = await api.get(`/returns/customer/${customerId}`);
    return response.data;
  },
  create: async (returnData) => {
    const response = await api.post("/returns", returnData);
    return response.data;
  },
};

// Customers management endpoints
export const customersApi = {
  getAll: async () => {
    const response = await api.get("/users/customers");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/users/customers/${id}`);
    return response.data;
  },
  getPayments: async (customerId) => {
    const response = await api.get(`/payments/customer/${customerId}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/users/customers/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, isActive) => {
    const response = await api.patch(`/users/customers/${id}/status`, { isActive });
    return response.data;
  },
  updateBorrowLimit: async (id, data) => {
    const payload = typeof data === "object" && data !== null ? data : { manualBorrowLimit: data };
    const response = await api.put(`/users/customers/${id}`, payload);
    return response.data;
  },
  recalculateTrust: async (customerId) => {
    const response = await api.post(`/customers/${customerId}/recalculate-trust`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/customers/${id}`);
    return response.data;
  },
};

// Sales management endpoints
export const salesApi = {
  create: async (saleData) => {
    const response = await api.post("/sales", saleData);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get("/sales");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
  getCustomerSales: async (customerId) => {
    const response = await api.get(`/sales/customer/${customerId}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/sales/${id}/status`, { status });
    return response.data;
  },
};

// About metadata endpoints
export const aboutApi = {
  get: async () => {
    const response = await api.get("/about");
    return response.data;
  },
};

// Helper to parse JWT payload safely
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

// Local token helper utilities
export const getToken = () =>
  localStorage.getItem("adminAuthToken") || localStorage.getItem("authToken");
export const setToken = (token) => {
  localStorage.setItem("adminAuthToken", token);
  localStorage.setItem("authToken", token);
};
export const removeToken = () => {
  localStorage.removeItem("adminAuthToken");
  localStorage.removeItem("authToken");
};

// Local storage session wrapper
export const authStorage = {
  setToken: (token) => {
    localStorage.setItem("adminAuthToken", token);
    localStorage.setItem("authToken", token);
  },
  getToken: () => {
    return (
      localStorage.getItem("adminAuthToken") ||
      localStorage.getItem("authToken")
    );
  },
  removeToken: () => {
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("authToken");
  },
  setUser: (user) => {
    localStorage.setItem("adminAuthUser", JSON.stringify(user));
    localStorage.setItem("authUser", JSON.stringify(user));
  },
  getUser: () => {
    const userStr =
      localStorage.getItem("adminAuthUser") ||
      localStorage.getItem("authUser");
    let parsedUser = null;
    if (userStr) {
      try {
        parsedUser = JSON.parse(userStr);
      } catch {
        parsedUser = null;
      }
    }

    // Fallback: If user role or id is missing/corrupted, recover from valid JWT
    const token =
      localStorage.getItem("adminAuthToken") ||
      localStorage.getItem("authToken");
    if (token) {
      const jwtPayload = parseJwt(token);
      if (jwtPayload) {
        if (!parsedUser) {
          parsedUser = {
            id: jwtPayload.id,
            role: jwtPayload.role,
          };
        } else {
          if (!parsedUser.role && jwtPayload.role) {
            parsedUser.role = jwtPayload.role;
          }
          if (!parsedUser.id && jwtPayload.id) {
            parsedUser.id = jwtPayload.id;
          }
        }
      }
    }

    return parsedUser;
  },
  removeUser: () => {
    localStorage.removeItem("adminAuthUser");
    localStorage.removeItem("authUser");
  },
  clear: () => {
    localStorage.removeItem("adminAuthToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminAuthUser");
    localStorage.removeItem("authUser");
  },
};

// Generic authenticated request wrapper
export const authRequest = async (endpoint, options = {}) => {
  const response = await api({
    url: endpoint,
    ...options,
  });
  return response.data;
};

export default api;